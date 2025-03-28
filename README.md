# CS348-Project

# Netflix Review App

## How to Set Up and Run the Project

### 1. Install Dependencies
```sh
npm install
npm install express-session passport passport-local bcrypt
```

### 2. Set up PostgreSQL Database

#### Option 1: Using the Python Script (Recommended)
This method uses the Python script in the `project/data_loader` directory to create the database tables and load the data.

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

3. **Create tables and load data**
   Navigate to the `project/data_loader` directory and run:
   ```sh
   psql -U postgres -d netflix_reviews -f schema.sql
   python data_loader_script.py
   ```

4. **Create materialized views for trending categories**
   ```sh
   psql -U postgres -d netflix_reviews -f views.sql
   ```
   This creates optimized materialized views for frequently accessed data like trending movies and classic films.

#### Option 2: Manual Setup
If you prefer to set up the database manually:

```sh
psql -U postgres
CREATE DATABASE netflix_reviews;
\c netflix_reviews

CREATE TABLE netflix_titles (
    show_id VARCHAR(10),
    show_type VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    director VARCHAR(255),
    show_cast TEXT,
    country VARCHAR(100),
    date_added DATE,
    release_year INT,
    rating VARCHAR(20),
    duration VARCHAR(20),
    listed_in TEXT,
    description TEXT,
    PRIMARY KEY (show_id, release_year, title),
    UNIQUE(show_id)
);

CREATE TABLE users (
    uid SERIAL,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    PRIMARY KEY (uid)
);

# Add other tables as needed from schema.sql
```

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

## Features
- Browse Netflix shows and movies
- Search and filter content
- Add new shows to the database
- Rate and review content
- Create and manage watchlists