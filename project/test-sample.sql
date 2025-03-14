-- Search movies with "Star Wars" in title, sorted by release year
SELECT title, release_year, show_type
FROM netflix_titles 
WHERE LOWER(title) LIKE '%' || LOWER('star wars') || '%'
ORDER BY release_year DESC;

-- Search all titles in Thrillers genre
SELECT title, release_year, show_type, listed_in
FROM netflix_titles
WHERE listed_in LIKE 'Thriller' || '%'
ORDER BY release_year DESC
LIMIT 5;

-- Load movies from database
SELECT *
FROM netflix_titles
ORDER BY title
LIMIT 5 OFFSET 0;

-- Search for user given a username and password for login
SELECT count(username) 
FROM users 
GROUP BY username, password 
HAVING username='admin' and password='password';

-- Insert a new movie
INSERT INTO netflix_titles (
    show_id, show_type, title, director, show_cast, country, date_added, 
    release_year, rating, duration, listed_IN, description
) VALUES ('s99999', 'movie', 'tester', 'ee', 'one two three', 'ee', '1999-03-31', 1999, 'PG13', '90 mins', 'cc', 'cc');