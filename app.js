const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');

const app = express();
const port = 3000;

// In-memory cache with a default expiration time of 1 hour
const cache = new NodeCache({ stdTTL: 900 });

app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));


app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

// Middleware to implement rate limiting
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
	windowMs: 5 * 1000,
	max: 30, // limit each IP to 10 requests per windowMs
	handler: (req, res) => {
		res.status(429).json(409);
	},
});

// app.use('/search/:mediaSearch', limiter);
// app.use('/title/:mediaID', limiter);

// https://github.com/tuhinpal/imdb-api
app.get('/search/:mediaSearch', async (req, res) => {

	const search = req.params.mediaSearch;

	// https://imdb-api.projects.thetuhin.com/search?query=ironman
	try {
		// Check if the result is already in the cache
		const cachedResult = cache.get(search);
		if (cachedResult) {
			console.log('Using cached result for', search);
			res.json(cachedResult);
		} else {
			// If not in the cache, make the API request and store the result in the cache
			const searchResponse = await axios.get(`https://imdb-api.projects.thetuhin.com/search?query=${search}`);
			const mediaResults = searchResponse.data.results;

			// Store the result in the cache with the search query as the key
			cache.set(search, mediaResults);

			res.json(mediaResults);
		}
	} catch (error) {
		console.log('Search Error', error.name);
		console.error('Search Error:', error.message);
		res.status(500).send('Internal Server Error');
	}
});

app.get('/title/:mediaID', async (req, res) => {
	const id = req.params.mediaID;

	try {
		// Check if the result is already in the cache
		const cachedResult = cache.get(id);
		if (cachedResult) {
			console.log('Using cached result for title ID:', id);
			res.json(cachedResult);
		} else {
			// If not in the cache, make the API request and store the result in the cache
			const idResponse = await axios.get(`https://imdb-api.projects.thetuhin.com/title/${id}`);
			const result = idResponse.data;

			// Store the result in the cache with the title ID as the key
			cache.set(id, result);

			res.json(result);
		}
	} catch (e) {
		console.log('Title Error', e.name);
		console.log('Title Error', e.message);
		res.status(500).send('Internal Server Error');
	}
});


app.post('/getMovieInfo', async (req, res) => {
	const movieName = req.body.movieName;

	// Check if movie information is in the cache
	const cachedMovieInfo = movieCache.get(movieName);
	if (cachedMovieInfo) {
		return res.send(cachedMovieInfo);
	}

	try {
		const response = await axios.get(`https://rotten-tomatoes-api.ue.r.appspot.com/movie/${movieName}`);
		const movieInfo = response.data;
		let tableRows = '';

		if (Array.isArray(movieInfo.movies)) {
			// Handle multiple movies
			const promises = movieInfo.movies.map(async (movie) => {
				return `
          <tr>
            <td>
              <p>Title: ${movie.name}</p>
            </td>
            <td>
              <p>Audience: ${movie.audience_score}</p>
              <p>Tomato: ${movie.tomatometer}</p>
              <p>Genres: ${movie.genres.join(', ')}</p>
              <p>Duration: ${movie.duration}</p>
              <p>Release Year: ${movie.year}</p>
            </td>
          </tr>
        `;
			});

			// Execute all promises concurrently
			const rows = await Promise.all(promises);
			tableRows = rows.join('');
		} else {
			// Handle a single movie
			tableRows = `
        <tr>
          <td>
            <p>Title: ${movieInfo.name}</p>
          </td>
          <td>
            <p>Audience: ${movieInfo.audience_score}</p>
            <p>Tomato: ${movieInfo.tomatometer}</p>
            <p>Genres: ${movieInfo.genres.join(', ')}</p>
            <p>Duration: ${movieInfo.duration}</p>
            <p>Release Year: ${movieInfo.year}</p>
          </td>
        </tr>
      `;
		}

		const htmlResponse = `
      <h2>Movies Information</h2>
      <table border="1">
        ${tableRows}
      </table>
    `;

		// Cache the movie information
		movieCache.set(movieName, htmlResponse);

		res.send(htmlResponse);
	} catch (error) {
		res.send('Error fetching movie information. Please try again.');
	}
});

app.listen(port, () => {
	console.log(`Server is running at http://localhost:${port}`);
});
