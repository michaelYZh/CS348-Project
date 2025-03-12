# Tables Setup and Data Loading

## Setting up Tables
To create the appropriate tables needed for the application, run the following command in the terminal (NOTE, your username might be `postgres` by default if you haven't made a usename for PostgreSQL):  
```
psql -U <username> -d netflix_reviews -f schema.sql
```
TODO: We should do 1 of the following:  
1) Add all our tables in `schema.sql` so that we can create all our tables in 1 go
2) Perhaps have some migration system, and have different tables made in different sql files so we don't have to re-create all of them (this is a bit extra though and probably unecessary)

## Data Loading
Data loading is done via a Python script. Before we load the data, we need to download some Python packages! 
### 1. Pre-requirements
If you don't already have Python installed, please do so via `python.org` or a terminal download tutorial found online! It should also include the package installer `pip` with the Python download.

### 2. Download packages
In your terminal, run the following command to download the required packages:
```
pip install psycopg2 pandas sqlalchemy
```

### 3. Create tables
Following the `Setting up Tables` step.

### 4. Load data
In your terminal, naviguate to to this Readme's directory (`data_loader`), and then run the following command to load the data into your database's table:

```
python data_loader_script.py
```
