
-- Search movies with "Star Wars" in title, sorted by release year
SELECT title, release_year, show_type, duration, description
FROM netflix_titles
WHERE LOWER(title) LIKE LOWER('Star Wars%')
ORDER BY title;

SELECT *
FROM netflix_titles
ORDER BY title
LIMIT 5 OFFSET 0;
