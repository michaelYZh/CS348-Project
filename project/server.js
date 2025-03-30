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

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

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

app.get("/movies", (req, res) => {
    // Pass the category parameter to the movies page
    const category = req.query.category || '';
    res.sendFile(path.join(__dirname, 'public', 'movies.html'));
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
        const category = req.query.category || "";
        
        console.log("API request with category:", category);

        let query, countQuery, queryParams;

        if (category === "trending-movies") {
            query = "SELECT * FROM trending_movies LIMIT $1 OFFSET $2";
            countQuery = "SELECT COUNT(*) FROM trending_movies";
            queryParams = [limit, offset];
        } 
        else if (category === "trending-tv-shows") {
            query = "SELECT * FROM trending_tv_shows LIMIT $1 OFFSET $2";
            countQuery = "SELECT COUNT(*) FROM trending_tv_shows";
            queryParams = [limit, offset];
        }
        else if (category === "new-releases") {
            query = "SELECT * FROM new_releases LIMIT $1 OFFSET $2";
            countQuery = "SELECT COUNT(*) FROM new_releases";
            queryParams = [limit, offset];
        }
        else if (category === "classic-films") {
            query = "SELECT * FROM classic_films LIMIT $1 OFFSET $2";
            countQuery = "SELECT COUNT(*) FROM classic_films";
            queryParams = [limit, offset];
        }
        else {
            // Regular search
            queryParams = [];
            let whereClause = "";
            
            if (searchQuery) {
                whereClause = "WHERE LOWER(title) LIKE LOWER($1)";
                queryParams.push(`%${searchQuery}%`);
            }
            
            if (req.query.filter) {
                if (whereClause) {
                    whereClause += ` AND show_type = $${queryParams.length + 1}`;
                } else {
                    whereClause = `WHERE show_type = $1`;
                }
                queryParams.push(req.query.filter);
            }
            
            countQuery = `SELECT COUNT(*) FROM netflix_titles ${whereClause}`;
            
            let sortField = req.query.sortField || "title";
            let sortOrder = req.query.sortOrder || "ASC";
            if (!["title", "release_year"].includes(sortField)) {
                sortField = "title";
            }
            sortOrder = sortOrder.toUpperCase() === "DESC" ? "DESC" : "ASC";
            
            query = `
                SELECT title, release_year, show_type, duration, description
                FROM netflix_titles
                ${whereClause}
                ORDER BY ${sortField} ${sortOrder}
                LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
            `;
            
            queryParams.push(limit, offset);
        }

        console.log("Query:", query);
        console.log("Params:", queryParams);

        // Execute queries
        const countResult = await pool.query(countQuery, category ? [] : queryParams.slice(0, -2));
        const result = await pool.query(query, queryParams);
        
        const totalMovies = parseInt(countResult.rows[0].count);
        const maxPage = Math.ceil(totalMovies / limit);

        res.json({ 
            movies: result.rows, 
            currentPage: page, 
            maxPage: maxPage
        });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ error: "Database query error", details: err.message });
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

// Endpoint to view audit logs
app.get("/api/audit", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, operation, table_name, show_id, uid, change_timestamp, details FROM audit_log ORDER BY change_timestamp DESC"
    );
    res.status(200).json({ auditLogs: result.rows });
  } catch (err) {
    console.error("Error fetching audit logs:", err);
    res.status(500).json({ error: "Database query error while fetching audit logs." });
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

// Used for displaying movie analytics on the individual movie page
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

// Watchlist html page
app.get("/watchlist", ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "watchlist.html"));
});

// Add a row to the watchlist
app.post('/api/watchlist', ensureAuthenticated, async (req, res) => {
  try {
    const { show_id, title, status, tier } = req.body;
    const uid = req.user.uid;

    if (!show_id || !title || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if already exists
    const exists = await pool.query(
      `SELECT 1 FROM watch_list WHERE show_id = $1 AND uid = $2`,
      [show_id, uid]
    );
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: "Already in watchlist" });
    }

    await pool.query(
      `INSERT INTO watch_list (show_id, uid, status, added_at, tier)
       VALUES ($1, $2, $3, CURRENT_DATE, $4)`,
      [show_id, uid, status.toLowerCase(), tier ? tier.toLowerCase() : null]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error adding to watchlist:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a watchlist entry
app.post("/api/watchlist/update", ensureAuthenticated, async (req, res) => {
  try {
    const { show_id, status, tier } = req.body;
    const uid = req.user.uid;

    if (!show_id) return res.status(400).json({ error: "Missing show_id" });

    await pool.query(`
      UPDATE watch_list
      SET status = $1, tier = $2
      WHERE show_id = $3 AND uid = $4
    `, [status.toLowerCase(), tier ? tier.toLowerCase() : null, show_id, uid]);

    res.json({ success: true });
  } catch (err) {
    console.error("Error updating watchlist:", err);
    res.status(500).json({ error: "Failed to update watchlist" });
  }
});

// Get user's watchlist
app.get("/api/watchlist", ensureAuthenticated, async (req, res) => {
  try {
    const uid = req.user.uid;
    const query = `
      SELECT w.show_id, w.status, w.tier, w.added_at, nt.title
      FROM watch_list w
      JOIN netflix_titles nt ON w.show_id = nt.show_id
      WHERE w.uid = $1
      ORDER BY w.added_at DESC;
    `;
    const result = await pool.query(query, [uid]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching watchlist:", err);
    res.status(500).json({ error: "Internal error fetching watchlist" });
  }
});

// Add a new show to the database
app.post("/api/add-show", async (req, res) => {
  try {
    const {
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
    if (!showType || !title || !releaseYear) {
      return res.status(400).json({ error: "Missing required fields: showType, title, and releaseYear are required" });
    }

    // Format date for SQL
    let formattedDate = null;
    if (dateAdded) {
      formattedDate = dateAdded; // The input date is already in YYYY-MM-DD format
    }

    // Insert the new show using SQL query
    const insertQuery = `
      INSERT INTO netflix_titles (
        show_type, title, director, show_cast, country, date_added, 
        release_year, rating, duration, listed_in, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;
    
    const values = [
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
    
    // After successful addition, refresh relevant view
    if (showType === 'Movie') {
      await pool.query('REFRESH MATERIALIZED VIEW trending_movies');
    } else if (showType === 'TV Show') {
      await pool.query('REFRESH MATERIALIZED VIEW trending_tv_shows');
    }
    
    // Possibly refresh other views as needed
    if (releaseYear >= new Date().getFullYear() - 2) {
      await pool.query('REFRESH MATERIALIZED VIEW new_releases');
    }
    if (releaseYear < 2000) {
      await pool.query('REFRESH MATERIALIZED VIEW classic_films');
    }
    
    res.status(201).json({ 
      message: "Show added successfully", 
      show: result.rows[0] 
    });
    
  } catch (err) {
    console.error("Error adding new show:", err);
    res.status(500).json({ error: "Database error while adding new show" });
  }
});
app.get("/recently-added", ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "recently-added.html"));
});
app.get("/api/recently-added", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT show_id, title, release_year, show_type, duration, description
      FROM netflix_titles
      ORDER BY show_id DESC
      LIMIT 50`);
    res.send(result.rows)
  }
  catch (e) {
    console.error("Error getting recently added shows:", e);
    res.status.send(500).json({error: "Error getting recently added shows"})
  }
})

async function refreshMaterializedViews() {
  try {
    await pool.query('REFRESH MATERIALIZED VIEW trending_movies');
    await pool.query('REFRESH MATERIALIZED VIEW trending_tv_shows');
    await pool.query('REFRESH MATERIALIZED VIEW new_releases');
    await pool.query('REFRESH MATERIALIZED VIEW classic_films');
    console.log('Materialized views refreshed successfully');
  } catch (error) {
    console.error('Error refreshing materialized views:', error);
  }
}

// Refresh views once when server starts
refreshMaterializedViews();

// Refresh views periodically (e.g., once a day)
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
setInterval(refreshMaterializedViews, ONE_DAY_MS);

app.post('/api/admin/refresh-views', async (req, res) => {
  try {
    await refreshMaterializedViews();
    res.json({ success: true, message: 'Views refreshed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
