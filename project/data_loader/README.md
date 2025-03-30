# Tables Setup and Data Loading

## Setting up Tables
To create the appropriate tables needed for the application, run the following command in the terminal (NOTE, your username might be `postgres` by default if you haven't made a username for PostgreSQL):  
```
psql -U <username> -d netflix_reviews -f schema.sql
```
TODO: We should do 1 of the following:  
1) Add all our tables in `schema.sql` so that we can create all our tables in 1 go
2) Perhaps have some migration system, and have different tables made in different sql files so we don't have to re-create all of them (this is a bit extra though and probably unecessary)

## Setting up Materialized Views
The application uses materialized views to optimize access to trending movies and other frequently accessed data. To create these views:

```
psql -U <username> -d netflix_reviews -f views.sql
```

This will create the following materialized views:
- `trending_movies`: Recently added movies, sorted by date added and release year
- `trending_tv_shows`: Recently added TV shows, sorted by date added and release year
- `new_releases`: Content from the last 2 years, sorted by release year
- `classic_films`: Movies released before 2000, sorted by release year

Each view is limited to 100 entries to optimize performance while still providing a good selection of content.

## Data Loading
Data loading is done via a Python script. Before we load the data, we need to download some Python packages! 
### 1. Pre-requirements
If you don't already have Python installed, please do so via `python.org` or a terminal download tutorial found online! It should also include the package installer `pip` with the Python download.

### 2. Download packages
In your terminal, run the following command to download the required packages:
```
pip install psycopg2 pandas sqlalchemy
```

### 3. Load data
In your terminal, naviguate to to this Readme's directory (`data_loader`), and then run the following command to load the data into your database's table:

```
python data_loader_script.py
```

### 4. Create materialized views
After loading the data, create the materialized views for optimized access:

```
psql -U <username> -d netflix_reviews -f views.sql
```

### How to Refresh Views
Connect to the database and run the refresh commands:

```
psql -U <username> -d netflix_reviews
```

Then execute:
```sql
REFRESH MATERIALIZED VIEW trending_movies;
REFRESH MATERIALIZED VIEW trending_tv_shows;
REFRESH MATERIALIZED VIEW new_releases;
REFRESH MATERIALIZED VIEW classic_films;
```
