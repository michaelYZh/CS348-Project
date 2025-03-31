# Netflix Review App

## How to Set Up and Run the Project

### 1. Install Dependencies
```sh
npm install
npm install express-session passport passport-local bcrypt
```

### 2. Set up PostgreSQL Database

This method uses the Python script in the `project/data_loader` directory to create database tables, load data, and create materialized views in a single step.

1. **Install Python and required packages**
   ```sh
   pip install psycopg2 pandas sqlalchemy
   ```

2. **Create the database**
   ```sh
   psql -U postgres
   CREATE DATABASE netflix_reviews;
   \q
   ```

3. **Run the setup script**
   Navigate to the `project/data_loader` directory and run:
   ```sh
   python data_loader_script.py
   ```
   
   This single command will:
   - Create all necessary database tables defined in `schema.sql`
   - Load data from CSV files
   - Create optimized materialized views for trending categories defined in `views.sql`

### 3. Create an OMDB account and fetch a key
Visit `https://www.omdbapi.com/apikey.aspx` and create an account using your email, with the free account type. You will get an email with your API key.

### 4. Create `.env` file
Create a `.env` file in the root directory with the following information:
```
DATABASE_URL=postgres://postgres:your_password@localhost:5432/netflix_reviews
OMDB_API_KEY=<your_omdb_key>
SESSION_SECRET=<your_session_key>
```
Replace `your_password` with your PostgreSQL password and `<your_omdb_key>` with the API key you received.

### 5. Run the server
```sh
cd project
node server.js
```

### 6. Access the Application
Open your browser and navigate to:
```
http://localhost:3000
```

## Database Structure

### Tables
The application uses the following tables:
- `netflix_titles`: Stores Netflix shows and movies
- `users`: Stores user account information
- `ratings`: Stores user ratings and reviews
- `show_tiers`: Stores user-defined tier rankings for shows
- `watch_list`: Stores user watch lists with status information
- `audit_log`: Tracks changes to ratings for auditing purposes

### Materialized Views
The application uses these optimized materialized views (created in `views.sql`) to improve performance for frequently accessed data:
- `trending_movies`: Recently added movies, sorted by date added and release year
- `trending_tv_shows`: Recently added TV shows, sorted by date added and release year
- `new_releases`: Content from the last 2 years, sorted by release year
- `classic_films`: Movies released before 2000, sorted by release year

Each view is limited to 100 entries for better performance and faster query response times.

### Refreshing Materialized Views
Connect to the database and run the refresh commands:

```
psql -U <username> -d netflix_reviews
```

Then execute:
```sql
REFRESH MATERIALIZED VIEW trending_movies;
REFRESH MATERIALIZED VIEW trending_tv_shows;
REFRESH MATERIALIZED VIEW new_releases;
REFRESH MATERIALIZED VIEW classic_films;
```

## Features
- Browse Netflix shows and movies
- Search and filter content
- Add new shows to the database
- Rate and review content
- Create and manage watchlists