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
			fetchMediaData('');
	}
});


function fetchMediaData(media) {

	if (media.length < INPUT_LENGTH) {
		document.getElementsByClassName('search-results')[0].style.display = 'none';
		return;
	};

	// Fetch media data from the server
	fetch(`/search/${media}`)
		.then(response => response.json())
		.then(data => {

			if (data === 409) {
				console.log("SLOW DOWN!");
				return;
			}
			displayResults(data);
		})
		.catch(error => console.error('Error fetching media data:', error));
}


function displayResults(data) {
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
				clickedMediaInfo(item);
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


async function clickedMediaInfo(item) {
	document.getElementsByClassName('search-results')[0].style.display = 'none';

	var mediaInfo;
	// Fetch media data from the server (for imdb)
	await fetch(`/imdb/media/${item.id}`)
		.then(response => response.json())
		.then(data => {
			mediaInfo = data;
		})
		.catch(error => console.error('Error fetching media data:', error));


	document.querySelector('.display-info-imdb').innerHTML = `
		<p class="imdb-title"><b>Name:</b> ${mediaInfo.title}</p>
		<p class="imdb-year"><b>Year</b>: ${mediaInfo.year}</p>
		<p class="imdb-rating"><b>Ratings:</b> ${[mediaInfo.rating.star, mediaInfo.rating.count].join(' by ')}</p>
		<p class="imdb-genre"><b>Genres:</b> ${mediaInfo.genre.join(', ')}</p>
		<p class="imdb-runtime"><b>Runtime:</b> ${mediaInfo.runtime}</p>
		<p class="imdb-plot">${mediaInfo.plot}</p>
		<p class="imdb-url" style="display:none;">${mediaInfo.imdb}</p>
		`

	// Fetch media data from the server (for imdb)
	await fetch(`/rottom/media/${mediaInfo.title}`)
		.then(response => response.json())
		.then(data => {
			console.log("data")
			console.log(data)
			mediaInfo = data;
		})
		.catch(error => console.error('Error fetching media data:', error));

	document.querySelector('.display-info-rottom').innerHTML = `
		<p class="rottom-critic"><b>Critic Score:</b> ${mediaInfo.tomatometer}</p>
		<p class="rottom-audience"><b>Audience Score:</b> ${mediaInfo.audience_score}</p>
		<p class="rottom-title" style="display:none;">${mediaInfo.name}</p>
		<p class="rottom-year" style="display:none;"><b>Year:</b> ${mediaInfo.year}</p>
		<p class="rottom-genre" style="display:none;"><b>Genre:</b> ${mediaInfo.genres.join(', ')}</p>
		<p class="rottom-runtime" style="display:none;"><b>Runtime:</b> ${mediaInfo.duration}</p>
		`
}

