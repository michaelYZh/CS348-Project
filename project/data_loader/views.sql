-- Drop existing views if they exist
DROP MATERIALIZED VIEW IF EXISTS trending_movies;
DROP MATERIALIZED VIEW IF EXISTS trending_tv_shows;
DROP MATERIALIZED VIEW IF EXISTS new_releases;
DROP MATERIALIZED VIEW IF EXISTS classic_films;

-- Create materialized view for trending movies (limit to 100)
CREATE MATERIALIZED VIEW trending_movies AS
SELECT show_id, title, release_year, show_type, duration, description, date_added
FROM netflix_titles
WHERE show_type = 'Movie'
ORDER BY date_added DESC, release_year DESC
LIMIT 100;

-- Create materialized view for trending TV shows (limit to 100)
CREATE MATERIALIZED VIEW trending_tv_shows AS
SELECT show_id, title, release_year, show_type, duration, description, date_added
FROM netflix_titles
WHERE show_type = 'TV Show'
ORDER BY date_added DESC, release_year DESC
LIMIT 100;

-- Create materialized view for new releases (limit to 100)
CREATE MATERIALIZED VIEW new_releases AS
SELECT show_id, title, release_year, show_type, duration, description, date_added
FROM netflix_titles
WHERE release_year >= EXTRACT(YEAR FROM CURRENT_DATE) - 4
ORDER BY release_year DESC, date_added DESC
LIMIT 100;

-- Create materialized view for classic films (limit to 100)
CREATE MATERIALIZED VIEW classic_films AS
SELECT show_id, title, release_year, show_type, duration, description, date_added
FROM netflix_titles
WHERE release_year < 2000
ORDER BY release_year DESC
LIMIT 100;