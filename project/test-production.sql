
-- Search movies with "Star Wars" in title, sorted by release year
SELECT title, release_year, show_type, duration, description
FROM netflix_titles
WHERE LOWER(title) LIKE LOWER('Star Wars%')
ORDER BY title;

-- List movies feature, only first 5
SELECT title, release_year, show_type, duration, description
FROM netflix_titles
ORDER BY title
LIMIT 5 OFFSET 0;

SELECT count(username)
FROM users
GROUP BY username, password
HAVING username='admin@gmail.com';

-- Insert a new movie
INSERT INTO netflix_titles (
    show_type, title, director, show_cast, country, date_added, 
    release_year, rating, duration, listed_IN, description
) VALUES ('movie', 'tester', 'ee', 'one two three', 'ee', '1999-03-31', 1999, 'PG13', '90 mins', 'cc', 'cc');


-- Select a single movie's metadata
SELECT title, release_year, show_type, duration, description, show_cast, country, rating, listed_in
FROM netflix_titles
WHERE LOWER(title) = LOWER('The Beast Stalker')
LIMIT 1;

-- Get reviews for a single movie
SELECT u.username, r.score, r.review
FROM ratings r
JOIN users u ON r.uid = u.uid
WHERE r.show_id = 3653
ORDER BY r.score DESC;
