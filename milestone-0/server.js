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

app.get("/reviews", async (req, res) => {
  try {
    res.send("hello");
    const result = await pool.query("SELECT * from netflix_titles LIMIT 10;");
    const reviews = result.rows;
    res.send(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).send("Querying from database error");
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
