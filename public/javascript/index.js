const INPUT_LENGTH = 4;
const MAX_RESULTS = 3;

document.addEventListener('mousedown', function (event) {
	const searchWrap = document.querySelector('.search-wrap');
	const searchResults = document.querySelector('.search-results');
	const searchInput = document.querySelector('.search-input');

	if (!searchWrap.contains(event.target)) {
		// Click is outside the search section, hide search results
		searchResults.style.display = 'none';
	} else {
		// Click is inside the search section, show search results
		if (searchInput.value.length >= INPUT_LENGTH)
			searchResults.style.display = '';
		else
			registerInput('');
	}
});

let submitActive = false;
function submitForm(event) {
	event.preventDefault(); // This prevents the default form submission behavior (page refresh)

	if (submitActive) return;

	// Fetch the value from the input field
	var inputValue = document.getElementsByClassName('search-input')[0].value;

	// Now you can use the fetchmedia function with the inputValue
	if (inputValue === "") return
	else fetchMediaData(inputValue);
}

let timerId;
function registerInput(val) {
	submitActive = false
	clearTimeout(timerId);
	if (val === "")
		document.getElementsByClassName('search-results')[0].style.display = 'none';
	else {
		timerId = setTimeout(function () {
			fetchMediaData(val);
		}, 1250);
	}
}

function fetchMediaData(media) {
	submitActive = true;
	clearTimeout(timerId);
	console.log("Fetching Media");

	// if (media.length < INPUT_LENGTH) return;

	// Fetch media data from the server
	fetch(`/search/${media}`)
		.then(response => response.json())
		.then(data => {
			if (data.status === 429) {
				return;
			}
			displayResults(data);
		})
		.catch(error => console.error('Error fetching media data:', error));
}


function displayResults(data) {
	console.log('Displaying Results...');

	if (data.length === 0) return

	const resultsContainer = document.getElementsByClassName('search-results')[0];

	resultsContainer.style.display = '';
	resultsContainer.innerHTML = '';

	var count = MAX_RESULTS;
	data.forEach(item => {
		count--;
		if (count < 0)
			return;

		const resultItemdiv = document.createElement('div');
		resultItemdiv.classList.add('search-results-item');

		const searchImg = document.createElement('img');
		searchImg.setAttribute('src', `${item.image}`);
		searchImg.classList.add('search-item-img');

		const searchItem = document.createElement('p');
		searchItem.classList.add('search-item-title');
		const searchItemYear = document.createElement('p');
		searchItemYear.classList.add('search-item-year');

		try {
			resultItemdiv.addEventListener('click', () => {
				resultsContainer.style.display = 'none';
				getMediaInfo(item);
			});
		} catch (error) { console.log(error.message) };

		resultItemdiv.appendChild(searchImg);
		resultItemdiv.appendChild(searchItem);
		resultItemdiv.appendChild(searchItemYear);
		searchItem.innerHTML = item.title;
		searchItemYear.innerHTML = item.year;


		resultsContainer.appendChild(resultItemdiv);
	});
}

number = 0;
async function getMediaInfo(item) {
	console.log('Displaying Media...');

	const container = document.getElementById('content-container');

	var mediaInfo;
	// Fetch media data from the server (for imdb)
	await fetch(`/imdb/media/${item.id}`)
		.then(response => response.json())
		.then(data => {
			mediaInfo = data;
		})
		.catch(error => console.error('Error fetching media data:', error));

	fetch('../media-template.html')
		.then(response => response.text())
		.then(template => {
			const mediaTable = document.createElement('div');
			mediaTable.setAttribute('id', `content-media-${number}`);
			const breaker = document.createElement('br');
			mediaTable.innerHTML = template;

			// Append the populated template to the document
			container.insertBefore(mediaTable, container.firstChild);
			container.appendChild(breaker);

			const posterImg = document.createElement('img');
			posterImg.setAttribute('src', `${mediaInfo.image}`);
			// posterImg.classList.add('search-item-img');

			document.querySelector('.media-poster').appendChild(posterImg);

			document.querySelector('.imdb-title').innerHTML = `${mediaInfo.title}`;
			document.querySelector('.imdb-year').innerHTML = `${mediaInfo.year}`;
			document.querySelector('.imdb-genre').innerHTML = `${mediaInfo.genre.join(',\n')}`;
			document.querySelector('.imdb-runtime').innerHTML = `${mediaInfo.runtime}`;
			document.querySelector('.imdb-plot').innerHTML = `${mediaInfo.plot}`;

			document.querySelector('.imdb-score').innerHTML +=
				`<b>${mediaInfo.rating.star}</b> by ${formatAudienceCount(mediaInfo.rating.count)}`;

			number++;
		})
		.catch(error => {
			console.error('Error fetching template:', error);
		});

	await fetch(`/rottom/media/${mediaInfo.title}`)
		.then(response => response.json())
		.then(data => {
			console.log(data)
			document.querySelector('.rottom-score-critic').innerHTML = `${data.tomatometer}`;
			document.querySelector('.rottom-score-audience').innerHTML = `${data.audience_score}`;
		})
		.catch(error => console.error('Error fetching media data:', error));
}

const formatAudienceCount = (count) => {
	if (count >= 1000000) {
		return `${(count / 1000000).toFixed(1)}M`;
	} else if (count >= 1000) {
		return `${(count / 1000).toFixed(0)}k`;
	} else {
		return count.toString();
	}
};
