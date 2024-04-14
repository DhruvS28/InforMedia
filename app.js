const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
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
	max: 10, // limit each IP to 10 requests per windowMs
	handler: (req, res) => {
		res.status(429).json({ status: 429 });
	},
});


// https://github.com/tuhinpal/imdb-api
app.get('/search/:mediaSearch', limiter, async (req, res) => {
	const search = req.params.mediaSearch;
	const maxRetries = 3;

	// Function to perform the API request
	const performSearchRequest = async () => {
		const searchResponse = await axios.get(`https://imdb-api.28dhruv03.workers.dev/search?query=${search}`);
		return searchResponse.data.results;
	};

	try {
		// Check if the result is already in the cache
		const cachedResult = cache.get(search);
		if (cachedResult) {
			console.log('Using cached result for', search);
			res.json(cachedResult);
		} else {
			// Retry logic
			for (let retry = 1; retry <= maxRetries; retry++) {
				try {
					const mediaResults = await performSearchRequest();
					// Store the result in the cache with the search query as the key
					cache.set(search, mediaResults);
					res.json(mediaResults);
					return; // Break the loop if successful
				} catch (error) {
					console.error(`Error on attempt ${retry}:`, error.message);
					if (retry < maxRetries) {
						console.log(`Retrying... (${retry}/${maxRetries})`);
					}
				}
			}
			// If all retries fail, return Internal Server Error
			res.status(500).send('Internal Server Error');
		}
	} catch (error) {
		console.log('Search Error', error.name);
		console.error('Search Error:', error.message);
		res.status(500).send('Internal Server Error');
	}
});


app.get('/imdb/media/:mediaId', async (req, res) => {
	const id = req.params.mediaId;

	try {
		// Check if the result is already in the cache
		const cachedResult = cache.get(id);
		if (cachedResult) {
			console.log('Using cached result for title ID:', id);
			res.json(cachedResult);
		} else {
			// If not in the cache, make the API request and store the result in the cache
			const idResponse = await axios.get(`https://imdb-api.28dhruv03.workers.dev/title/${id}`);
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


app.get('/rottom/media/:contentType/:mediaId/:year', async (req, res) => {
	const type = req.params.contentType === 'movie' || req.params.contentType === 'tvMovie' ? 'm' : 
		req.params.contentType === 'tvSeries' ? 'tv' : null;
	const id = req.params.mediaId;
	const year = req.params.year;
	const formattedMediaId = id.replace(/:/g, '').replace(/-/g, '').replace(/ /g, '_');
	const formattedMediaIdWithYear = `${formattedMediaId}_${year}`;

	let url;
	url = `https://www.rottentomatoes.com/${type}/${formattedMediaIdWithYear}`;
	console.log(url)
	let response;
	try {
		response = await axios.get(url);
	} catch (error) {
		url = `https://www.rottentomatoes.com/${type}/${formattedMediaId}`;
		console.log(url)
		try {
			response = await axios.get(url);
		} catch (error) {
			console.error('Error:', error);
			res.json({ "tomatometer": '-', "audience_score": '-' });
			return;
		}
	}

	try {
		const html = response.data;
		const $ = cheerio.load(html);

		// Function to query data-qa attributes
		const queryMovie = (selector) => {
			return $('#scoreboard')[0].attributes[`${selector}`].value;
		};
		const queryTv = (selector) => {
			return $(`media-scorecard [slot="${selector}"]`).html();
		};

		let tomatometer, audienceScore;
		if (type === 'm') {
			tomatometer = queryMovie(8) !== '' || null ? queryMovie(8) : '-';
			audienceScore = queryMovie(1) !== '' || null ? queryMovie(1) : '-';
		} else if (type === 'tv') {
			tomatometer = queryTv('criticsScore') !== '' || null ? queryTv('criticsScore') : '-';
			audienceScore = queryTv('audienceScore') !== '' || null ? queryTv('audienceScore') : '-';
		}

		res.json({ "tomatometer": tomatometer, "audience_score": audienceScore, "url": url});
	} catch (error) {
		console.error('Error:', error);
		res.json({ "tomatometer": '-', "audience_score": '-' });
	}
});


app.listen(port, () => {
	console.log(`Server is running at http://localhost:${port}`);
});
