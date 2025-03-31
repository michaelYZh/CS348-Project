DROP TABLE IF EXISTS Ratings CASCADE;
DROP TABLE IF EXISTS Watch_List CASCADE;
DROP TABLE IF EXISTS Reviews CASCADE;
DROP TABLE IF EXISTS Users CASCADE;
DROP TABLE IF EXISTS netflix_titles CASCADE;
DROP TABLE IF EXISTS show_tiers CASCADE;

CREATE TABLE netflix_titles (
    show_id SERIAL PRIMARY KEY,
    show_type VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    director VARCHAR(255),
    show_cast TEXT,
    country VARCHAR(255),
    date_added DATE,
    release_year INT,
    rating VARCHAR(20),
    duration VARCHAR(20),
    listed_in TEXT,
    description TEXT
);

CREATE TABLE users (
    uid SERIAL,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    PRIMARY KEY (uid)
);

CREATE TABLE ratings (
    show_id INTEGER NOT NULL,
    uid INTEGER NOT NULL,
    score INTEGER CHECK (score BETWEEN 0 AND 10),
    review TEXT,
    PRIMARY KEY (show_id, uid),
    FOREIGN KEY (show_id) REFERENCES netflix_titles(show_id),
    FOREIGN KEY (uid) REFERENCES Users(uid)
);

CREATE TABLE show_tiers (
    show_id INTEGER NOT NULL,
    uid INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    tier VARCHAR(1) NOT NULL,
    PRIMARY KEY (show_id, uid),
    FOREIGN KEY (show_id) REFERENCES netflix_titles(show_id),
    FOREIGN KEY (uid) REFERENCES Users(uid),
    CHECK (LOWER(tier) IN ('s', 'a', 'b', 'c', 'd'))
);

CREATE TABLE watch_list (
    show_id INTEGER NOT NULL,
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

-- audit table --
DROP TABLE IF EXISTS audit_log CASCADE;
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    operation VARCHAR(10) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    show_id VARCHAR(10),
    uid INTEGER,
    change_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT
);

CREATE OR REPLACE FUNCTION log_new_rating() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (operation, table_name, show_id, uid, details)
    VALUES (
        'INSERT',
        'ratings',
        NEW.show_id,
        NEW.uid,
        'Score: ' || NEW.score || ', Review: ' || COALESCE(NEW.review, 'N/A')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_rating_insert ON ratings;
CREATE TRIGGER after_rating_insert
AFTER INSERT ON ratings
FOR EACH ROW
EXECUTE PROCEDURE log_new_rating();

CREATE OR REPLACE FUNCTION log_rating_update() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (operation, table_name, show_id, uid, details)
    VALUES (
        'UPDATE',
        'ratings',
        NEW.show_id::varchar,
        NEW.uid,
        'Old Score: ' || OLD.score || ', New Score: ' || NEW.score ||
        ', Old Review: ' || COALESCE(OLD.review, 'N/A') ||
        ', New Review: ' || COALESCE(NEW.review, 'N/A')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_rating_update ON ratings;
CREATE TRIGGER after_rating_update
AFTER UPDATE ON ratings
FOR EACH ROW
EXECUTE PROCEDURE log_rating_update();

-- audit table complete --
