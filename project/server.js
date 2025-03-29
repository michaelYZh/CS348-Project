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


const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

app.use(session({
  secret: process.env.SESSION_SECRET, 
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      if (result.rows.length === 0) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.uid); 
});

// Route to get current user info
app.get("/debug-user", (req, res) => {
  if (!req.user) {
    return res.json({ user: null });
  }
  res.json({ user: { uid: req.user.uid, username: req.user.username } });
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE uid = $1', [id]);
    if (result.rows.length === 0) {
      return done(new Error("User not found"));
    }
    done(null, result.rows[0]);
  } catch (err) {
    done(err);
  }
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}


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

app.post("/login", passport.authenticate("local", {
  successRedirect: "/movies",
  failureRedirect: "/"
}));

app.post("/register", async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;

    if (!username || !password || !confirmPassword) {
      return res.status(400).send("All fields are required.");
    }
    if (password !== confirmPassword) {
      return res.status(400).send("Passwords do not match.");
    }

    const existingUser = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (existingUser.rows.length > 0) {
      return res.status(400).send("User already exists.");
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await pool.query("INSERT INTO users (username, password) VALUES ($1, $2) RETURNING uid", [username, hashedPassword]);
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating user account.");
  }
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/movies", ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "movies.html"));
});

app.get("/add-show", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "add-show.html"));
});

// used for searching and displaying all moveis, 2-in-1 function
app.get("/api/movies", async (req, res) => {
  try {
      const searchQuery = req.query.search || "";
      const page = parseInt(req.query.page) || 1;
      const limit = 100;
      const offset = (page - 1) * limit;

      const filterType = req.query.filter || ""; // e.g., "Movie" or "TV Show"
      let sortField = req.query.sortField || "title"; // default: sort by title
      let sortOrder = req.query.sortOrder || "ASC";     // default: ascending order

      // Whitelist allowed sort fields to prevent SQL injection
      const validSortFields = ["title", "release_year"];
      if (!validSortFields.includes(sortField)) {
          sortField = "title";
      }
      // Ensure sortOrder is either ASC or DESC
      sortOrder = sortOrder.toUpperCase() === "DESC" ? "DESC" : "ASC";

      // Build the count query with filtering
      let countQuery = `
          SELECT COUNT(*) AS total FROM netflix_titles
          WHERE LOWER(title) LIKE LOWER($1)
      `;
      let countParams = [`%${searchQuery}%`];
      if (filterType) {
          countQuery += " AND show_type = $2";
          countParams.push(filterType);
      }
      const countResult = await pool.query(countQuery, countParams);
      const totalMovies = parseInt(countResult.rows[0].total);
      const maxPage = Math.ceil(totalMovies / limit);

      // Build the main query with filtering and sorting
      let query = `
          SELECT title, release_year, show_type, duration, description
          FROM netflix_titles
          WHERE LOWER(title) LIKE LOWER($1)
      `;

      let queryParams = [`%${searchQuery}%`];
      if (filterType) {
          query += " AND show_type = $2";
          queryParams.push(filterType);
      }
      // Append sorting, limit, and offset clauses
      query += ` ORDER BY ${sortField} ${sortOrder} LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2};`;
      queryParams.push(limit, offset);

      const result = await pool.query(query, queryParams);
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

// API used for adding ratings
app.post("/api/ratings", ensureAuthenticated, async (req, res) => {
  try {
    const { title, score, review } = req.body;

    // Error checking
    if (!title || score == null) {
      return res.status(400).json({ error: "Title and score are required" });
    }

    // Show ID reqired to persist data into the database
    const showQuery = `SELECT show_id FROM netflix_titles WHERE LOWER(title) = LOWER($1) LIMIT 1;`;
    const showResult = await pool.query(showQuery, [title]);

    // Error checking
    if (showResult.rows.length === 0) {
      return res.status(404).json({ error: "Movie not found" });
    }

    const showId = showResult.rows[0].show_id;
    const uid = req.user.uid;

    // Insert/Update rating
    const insertQuery = `
      INSERT INTO ratings (show_id, uid, score, review)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (show_id, uid)
      DO UPDATE SET score = EXCLUDED.score, review = EXCLUDED.review;
    `;

    await pool.query(insertQuery, [showId, uid, score, review || null]);
    res.status(201).json({ message: "Rating submitted" });

  } catch (err) {
    console.error("Error submitting rating:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Movie analytics API
app.get("/api/movie/analytics", async (req, res) => {
  try {
    const title = req.query.title;
    if (!title) return res.status(400).json({ error: "Missing movie title" });

    const showIdQuery = `SELECT show_id FROM netflix_titles WHERE LOWER(title) = LOWER($1) LIMIT 1`;
    const showIdResult = await pool.query(showIdQuery, [title]);
    if (showIdResult.rows.length === 0) {
      return res.status(404).json({ error: "Movie not found" });
    }
    const showId = showIdResult.rows[0].show_id;

    const analyticsQuery = `
      SELECT
        u.username,
        r.score,
        r.review,
        RANK() OVER (ORDER BY r.score DESC) AS rank
      FROM ratings r
      JOIN users u ON r.uid = u.uid
      WHERE r.show_id = $1
    `;
    const statsQuery = `
      SELECT
        AVG(score)::numeric(4,1) AS average,
        MIN(score) AS min,
        MAX(score) AS max
      FROM ratings
      WHERE show_id = $1
    `;

    const [analyticsResult, statsResult] = await Promise.all([
      pool.query(analyticsQuery, [showId]),
      pool.query(statsQuery, [showId]),
    ]);

    res.json({
      stats: statsResult.rows[0],
      rankedRatings: analyticsResult.rows,
    });
  } catch (err) {
    console.error("Error fetching movie analytics:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Add a new show to the database
app.post("/api/add-show", async (req, res) => {
  try {
    const {
      showId,
      showType,
      title,
      director,
      showCast,
      country,
      dateAdded,
      releaseYear,
      rating,
      duration,
      listedIn,
      description
    } = req.body;

    // Validate required fields
    if (!showId || !showType || !title || !releaseYear) {
      return res.status(400).json({ error: "Missing required fields: showId, showType, title, and releaseYear are required" });
    }

    // Check if show_id already exists
    const checkQuery = `SELECT COUNT(*) FROM netflix_titles WHERE show_id = $1`;
    const checkResult = await pool.query(checkQuery, [showId]);
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      return res.status(409).json({ error: "A show with this ID already exists" });
    }

    // Format date for SQL
    let formattedDate = null;
    if (dateAdded) {
      formattedDate = dateAdded; // The input date is already in YYYY-MM-DD format
    }

    // Insert the new show using SQL query
    const insertQuery = `
      INSERT INTO netflix_titles (
        show_id, show_type, title, director, show_cast, country, date_added, 
        release_year, rating, duration, listed_in, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;
    
    const values = [
      showId,
      showType,
      title,
      director || null,
      showCast || null,
      country || null,
      formattedDate,
      releaseYear,
      rating || null,
      duration || null,
      listedIn || null,
      description || null
    ];

    const result = await pool.query(insertQuery, values);
    
    res.status(201).json({ 
      message: "Show added successfully", 
      show: result.rows[0] 
    });
    
  } catch (err) {
    console.error("Error adding new show:", err);
    res.status(500).json({ error: "Database error while adding new show" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
