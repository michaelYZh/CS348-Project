require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello, Netflix Review Database!");
});

app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

app.get("/movies", async (req, res) => {
  try {
    const result = await pool.query("SELECT * from netflix_titles;"); // query all movies
    const reviews = result.rows;
    // The display of the data
    // TODO: Change to actual UI once we use react
    let html = `
      <html>
      <head>
        <title>Reviews</title>
      </head>
      <body>
        <h1>Movie Reviews</h1>
        <table border="1">
          <tr>
            <th>Title</th>
            <th>Release year</th>
            <th>Type</th>
            <th>Duration</th>
            <th>Description</th>
          </tr>`;
    reviews.forEach(review => {
      html += `
      <tr>
        <td> ${review.title}</td>
        <td> ${review.release_year}</td>
        <td> ${review.show_type}</td>
        <td> ${review.duration}</td>
        <td> ${review.description}</td>`
    });
    html += `
    </table>
    </body>
    </html>`;

    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send("Querying from database error");
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
