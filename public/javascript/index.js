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
	// Fetch media data from the server
	await fetch(`/title/${item.id}`)
		.then(response => response.json())
		.then(data => {
			mediaInfo = data;
		})
		.catch(error => console.error('Error fetching media data:', error));

		
	// const displaySection = document.querySelector('.display-section');
	const imdbTitle = document.querySelector('.imdb-title');
	const imdbYear = document.querySelector('.imdb-year');
	const imdbRating = document.querySelector('.imdb-rating');
	const imdbGenre = document.querySelector('.imdb-genre');
	const imdbRuntime = document.querySelector('.imdb-runtime');
	const imdbPlot = document.querySelector('.imdb-plot');
	const imdbUrl = document.querySelector('.imdb-url');


	imdbTitle.innerHTML = mediaInfo.title;
	imdbYear.innerHTML = mediaInfo.year;
	imdbRating.innerHTML = [mediaInfo.rating.star, mediaInfo.rating.count].join(', ');
	imdbRuntime.innerHTML = mediaInfo.genre.join(', ');
	imdbRuntime.innerHTML = mediaInfo.runtime;
	imdbPlot.innerHTML = mediaInfo.plot;
	imdbUrl.innerHTML = mediaInfo.imdb;

	// console.log(`Selected: ${item.title}, ${mediaInfo.rating.star},
	// \nhttps://www.imdb.com/title/${mediaInfo.id}`);
	
}

