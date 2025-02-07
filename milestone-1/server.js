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
  try {
    let html = `
      <html>
      <head>
        <title>Login</title>
      </head>
      <body style="font-family: Arial; text-align: center;">
        <div>
          <div style="font-size: 20px;">
            <h1><span style="color: red;">Netflix</span> Movie Reviews</h1>
          </div>
          <h3>Login to your account</h3>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
            <input id="email" type="email" placeholder="Email" style="width: 300px; padding: 0.5rem;">
            <input id="password" type="password" placeholder="Password" style="width: 300px; padding: 0.5rem;">
          </div>
          <div style="margin-top: 1rem;">
            <button onclick="loginPushed()" style="padding: 0.5rem 1rem;">Login</button>
          </div>
          <script>
          function loginPushed() {
            const username = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            window.location.href = \`/login?username=\${username}&password=\${password}\`;
          }
        </script>
      </div>
      </body>
      </html>
    `;
    res.send(html);
  } catch (err) {
    console.log(err);
  }
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

app.get("/movies", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM netflix_titles ORDER BY title;"); // query all movies
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
