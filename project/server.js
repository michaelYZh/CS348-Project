require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const path = require("path");

const app = express();
const port = 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
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

app.get("/api/movies", async (req, res) => {
  try {
      const searchQuery = req.query.search || ""; // Get search term
      const page = parseInt(req.query.page) || 1; // Get page number, default to 1
      const limit = 100; // Movies per page
      const offset = (page - 1) * limit; // Calculate offset

      // Query to get the total count of matching movies
      const countQuery = `
          SELECT COUNT(*) AS total FROM netflix_titles
          WHERE LOWER(title) LIKE LOWER($1);
      `;
      const countResult = await pool.query(countQuery, [`%${searchQuery}%`]);
      const totalMovies = parseInt(countResult.rows[0].total);
      const maxPage = Math.ceil(totalMovies / limit); // Calculate the last possible page

      // Query to fetch movies with pagination
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



app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
