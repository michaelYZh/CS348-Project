require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const path = require("path");

const app = express();
const port = 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const OMDB_API_KEY = process.env.OMDB_API_KEY

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html")); // go to html page
});

// OMDB API key
app.get("/api/config", (req, res) => {
  res.json({ omdbApiKey: OMDB_API_KEY });
});

app.get("/login", async (req, res) => {
  try {
    const username = req.query.username;
    const password = req.query.password;
    console.log(username,password);
    const result = await pool.query(`SELECT count(username) FROM users GROUP BY username, password HAVING username='${username}' and password='${password}'`);
    if (result.rows.length > 0) res.redirect("../movies");
    else res.redirect("../");
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

app.get("/movies", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "movies.html"));
});

// used for searching and displaying all moveis, 2-in-1 function
app.get("/api/movies", async (req, res) => {
  try {
      const searchQuery = req.query.search || "";
      const page = parseInt(req.query.page) || 1;
      // query values (constant limit of results, page number)
      const limit = 100;
      const offset = (page - 1) * limit;

      // query amt of movies with certain search values, for dynamic display
      const countQuery = `
          SELECT COUNT(*) AS total FROM netflix_titles
          WHERE LOWER(title) LIKE LOWER($1);
      `;
      const countResult = await pool.query(countQuery, [`%${searchQuery}%`]);
      const totalMovies = parseInt(countResult.rows[0].total);
      const maxPage = Math.ceil(totalMovies / limit);

      // actual query for values
      const query = `
          SELECT title, release_year, show_type, duration, description
          FROM netflix_titles
          WHERE LOWER(title) LIKE LOWER($1)
          ORDER BY title
          LIMIT $2 OFFSET $3;
      `;
      const result = await pool.query(query, [`%${searchQuery}%`, limit, offset]);

      res.json({ movies: result.rows, currentPage: page, maxPage: maxPage });

  } catch (err) {
      console.error("Raw SQL Query Error:", err);
      res.status(500).json({ error: "Database query error" });
  }
});

// For a single movie
app.get("/api/movie", async (req, res) => {
  try {
      const title = req.query.title;
      // Error trapping incase the metadata is corrupted/someone inserted a movie erroneously
      if (!title) {
          return res.status(400).json({ error: "Missing movie title" });
      }

      // fetch all the movie metadata to display on the page
      const query = `
          SELECT title, release_year, show_type, duration, description, director, show_cast, country, rating, listed_in
          FROM netflix_titles
          WHERE LOWER(title) = LOWER($1)
          LIMIT 1;
      `;
      const result = await pool.query(query, [title]);
      // Error trapping incase the metadata is corrupted/someone inserted a movie erroneously
      if (result.rows.length === 0) {
          return res.status(404).json({ error: "Movie not found" });
      }

      res.json(result.rows[0]);
  } catch (err) {
      console.error("Error fetching movie details:", err);
      res.status(500).json({ error: "Database query error" });
  }
});

// Ratings for a movie
app.get("/api/ratings", async (req, res) => {
  try {
      const title = req.query.title;
      if (!title) {
          return res.status(400).json({ error: "Missing movie title" });
      }

      // Get show_id from title, to use to join with ratings table
      const showQuery = `SELECT show_id FROM netflix_titles WHERE LOWER(title) = LOWER($1) LIMIT 1;`;
      const showResult = await pool.query(showQuery, [title]);

      if (showResult.rows.length === 0) {
          return res.status(404).json({ error: "Movie not found" });
      }

      const showId = showResult.rows[0].show_id;

      // Fetch ratings for the given show_id (the foreign key)
      const ratingsQuery = `
          SELECT u.username, r.score, r.review
          FROM ratings r
          JOIN users u ON r.uid = u.uid
          WHERE r.show_id = $1
          ORDER BY r.score DESC;
      `;
      const ratingsResult = await pool.query(ratingsQuery, [showId]);

      res.json({ ratings: ratingsResult.rows }); // response

  } catch (err) {
      console.error("Error fetching ratings:", err);
      res.status(500).json({ error: "Database query error" });
  }
});



app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
