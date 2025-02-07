DROP TABLE IF EXISTS netflix_titles;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Ratings;

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

CREATE TABLE Users (
    uid SERIAL,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    PRIMARY KEY (uid)
);

CREATE TABLE Ratings (
    show_id VARCHAR(10) NOT NULL,
    uid INTEGER NOT NULL,
    rating INTEGER,
    PRIMARY KEY (show_id, uid),
    FOREIGN KEY (show_id) REFERENCES netflix_titles(show_id),
    FOREIGN KEY (uid) REFERENCES Users(uid)
);
