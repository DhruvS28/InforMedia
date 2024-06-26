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
		if (searchInput.value.length >= 1) searchResults.style.display = '';
		else registerInput('');
	}
});

let submitActive = false;
function submitForm(event) {
	// This prevents the default form submission behavior (page refresh)
	event.preventDefault();

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
	console.log("Fetching Media");
	submitActive = true;
	clearTimeout(timerId);

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


// number = 0;
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
			// mediaTable.setAttribute('id', `content-media-${number}`);
			const breaker = document.createElement('br');
			mediaTable.innerHTML = template;

			// Append the populated template to the document
			container.insertBefore(mediaTable, container.firstChild);
			container.appendChild(breaker);
			handleFooterPosition();

			const posterImg = document.createElement('img');
			posterImg.setAttribute('src', `${mediaInfo.image}`);

			document.querySelector('.media-poster').appendChild(posterImg);

			document.querySelector('.imdb-title').innerHTML = `${mediaInfo.title}`;
			document.querySelector('.imdb-year').innerHTML = `${mediaInfo.year}`;
			document.querySelector('.imdb-genre').innerHTML = `${mediaInfo.genre.join('\n')}`;
			document.querySelector('.imdb-runtime').innerHTML = `${mediaInfo.runtime}`;
			document.querySelector('.imdb-plot').innerHTML = `${mediaInfo.plot}`;

			document.querySelector('.imdb-score').innerHTML +=
				`<b>${mediaInfo.rating.star}</b> by ${formatAudienceCount(mediaInfo.rating.count)}`;
			document.querySelector('.imdb-score').addEventListener('click', function() {
				window.open(mediaInfo.imdb, '_blank');
			});

			// number++;
		})
		.catch(error => {
			console.error('Error fetching template:', error);
		});
	await fetch(`/rottom/media/${mediaInfo.contentType}/${mediaInfo.title}/${mediaInfo.year}`)
		.then(response => response.json())
		.then(data => {
			document.querySelector('.rottom-score-critic').innerHTML = `${data.tomatometer}`;
			document.querySelector('.rottom-score-audience').innerHTML = `${data.audience_score}`;

			document.querySelector('.rottom-score').addEventListener('click', function() {
				if (data.url) window.open(data.url, '_blank');
				else window.open(`https://www.rottentomatoes.com/search?search=${mediaInfo.title}`, '_blank');
			});
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

function handleFooterPosition() {
    var bodyHeight = document.body.scrollHeight;
    var viewportHeight = window.innerHeight;

    if (bodyHeight > viewportHeight) {
        document.querySelector('.footer-section').style.position = 'relative';
    }
};
document.addEventListener("DOMContentLoaded", handleFooterPosition());

// getMediaInfo({
//     "id": "tt0371746",
//     "title": "Iron Man",
//     "year": 2008,
//     "type": "movie",
//     "image": "https://m.media-amazon.com/images/M/MV5BMTczNTI2ODUwOF5BMl5BanBnXkFtZTcwMTU0NTIzMw@@._V1_UY396_CR6,0,267,396_AL_.jpg",
//     "image_large": "https://m.media-amazon.com/images/M/MV5BMTczNTI2ODUwOF5BMl5BanBnXkFtZTcwMTU0NTIzMw@@._V1_.jpg",
//     "api_path": "/title/tt0371746",
//     "imdb": "https://www.imdb.com/title/tt0371746"
// });
