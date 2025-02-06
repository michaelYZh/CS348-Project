DROP TABLE IF EXISTS netflix_titles;

CREATE TABLE netflix_titles (
    show_id VARCHAR(10) PRIMARY KEY,
    show_type VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    director VARCHAR(255),
    show_cast TEXT,
    country VARCHAR(100),
    date_added DATE,
    release_year INT,
    rating VARCHAR(20),
    duration VARCHAR(20),
    listed_IN TEXT,
    description TEXT
);
