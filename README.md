# CS348-Project

# Netflix Review App - Milestone 0

## How to Set Up and Run the Project

### 1. Install Dependencies
```sh
npm install
```
### 2. Set up PostgreSQL
```
psql -U postgres
CREATE DATABASE netflix_reviews;
\c netflix_reviews
CREATE TABLE users (id SERIAL PRIMARY KEY, username VARCHAR(100) UNIQUE NOT NULL);
CREATE TABLE reviews (id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id), movie_title VARCHAR(255) NOT NULL, review_text TEXT NOT NULL);
```

### 3. Create an OMDB account and fetch a key
Visit `https://www.omdbapi.com/apikey.aspx` and create an account using your email, with the free account type. You will get an email with your api key.

### 4. Create `.env` file
Paste the following information in the .env file
```
DATABASE_URL=postgres://postgres:your_password@localhost:5432/netflix_reviews
OMDB_API_KEY=<your_omdb_key>
```

### 5. Run the server
```
node server.js
```

### 6. Test
http://localhost:3000/users → User data