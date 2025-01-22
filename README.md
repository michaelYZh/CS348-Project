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

### 3. Create `.env` file
```
DATABASE_URL=postgres://postgres:your_password@localhost:5432/netflix_reviews
```

### 4. Run the server
```
node server.js
```

### 5. Test
http://localhost:3000/users → User data