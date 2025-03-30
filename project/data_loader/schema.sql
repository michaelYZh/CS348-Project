DROP TABLE IF EXISTS Ratings CASCADE;
DROP TABLE IF EXISTS Watch_List CASCADE;
DROP TABLE IF EXISTS Reviews CASCADE;
DROP TABLE IF EXISTS Users CASCADE;
DROP TABLE IF EXISTS netflix_titles CASCADE;

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

CREATE TABLE ratings (
    show_id VARCHAR(10) NOT NULL,
    uid INTEGER NOT NULL,
    score INTEGER CHECK (score BETWEEN 0 AND 10),
    review TEXT,
    PRIMARY KEY (show_id, uid),
    FOREIGN KEY (show_id) REFERENCES netflix_titles(show_id),
    FOREIGN KEY (uid) REFERENCES Users(uid)
);

CREATE TABLE watch_list (
    show_id VARCHAR(10) NOT NULL,
    uid INTEGER NOT NULL,
    status VARCHAR(255) NOT NULL,
    added_at DATE,
    tier VARCHAR(1),
    PRIMARY KEY (show_id, uid),
    FOREIGN KEY (show_id) REFERENCES netflix_titles(show_id),
    FOREIGN KEY (uid) REFERENCES Users(uid),
    CHECK (LOWER(status) IN ('planning', 'watching', 'finished')),
    CHECK (LOWER(tier) IN ('s', 'a', 'b', 'c', 'd'))
);

CREATE INDEX lowercase_title ON netflix_titles (LOWER(title));

