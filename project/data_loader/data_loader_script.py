import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy import text

# Load the data
csv_file_path = 'netflix_titles.csv'
data = pd.read_csv(csv_file_path)
user_data = pd.read_csv("users.csv")

# TODO: Make these a secret
postgres_password = "" # set to whatever your password is, default postgres is empty
db_url = f"postgresql://postgres:{postgres_password}@localhost:5432/netflix_reviews"
engine = create_engine(db_url)

# drop all tables and replace them, as this script re-writes data (and there are primary key dependencies)
with engine.connect() as conn:
    #conn.execute(text("DROP TABLE IF EXISTS Users CASCADE;"))
    conn.execute(text("DROP TABLE IF EXISTS netflix_titles CASCADE;"))
    conn.commit()

# Load into Postgresql
data.to_sql("netflix_titles", engine, if_exists="replace", index=False)
#user_data.to_sql("users", engine, if_exists="replace", index=False)

print("data loaded into table `netflix_reviews` successfully! Old data removed and replaced with new data from csv!")
