const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/getMovieInfo', async (req, res) => {
  const movieName = req.body.movieName;

  try {
	//https://rotten-tomatoes-api.ue.r.appspot.com/docs#/
    const response = await axios.get(`https://rotten-tomatoes-api.ue.r.appspot.com/search/${movieName}`);
    const movieInfo = response.data;
    let tableRows = '';

    if (Array.isArray(movieInfo.movies)) {
      // Handle multiple movies
      movieInfo.movies.forEach(movie => {
        tableRows += `
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

    res.send(`
      <h2>Movies Information</h2>
      <table border="1">
        ${tableRows}
      </table>
    `);
  } catch (error) {
    res.send('Error fetching movie information. Please try again.');
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
