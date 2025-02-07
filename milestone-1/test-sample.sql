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
