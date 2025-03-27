import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy import text

# Load the data
csv_file_path = 'netflix_titles.csv'
data = pd.read_csv(csv_file_path, quotechar='"')
data.drop('show_id', axis=1, inplace=True)
user_data = pd.read_csv("users.csv")

# TODO: Make these a secret
postgres_password = "" # set to whatever your password is, default postgres is empty
db_url = f"postgresql://postgres:{postgres_password}@localhost:5432/netflix_reviews"
engine = create_engine(db_url)

# run the schema
with engine.connect() as conn:
    with open("schema.sql", "r") as schema_file:
        schema_sql = schema_file.read()
    conn.execute(text(schema_sql))  # Execute schema creation SQL
    conn.commit()

# Load into Postgresql
data.to_sql("netflix_titles", engine, if_exists="append", index=False)
user_data.to_sql("users", engine, if_exists="append", index=False)

print("data loaded into table `netflix_reviews` successfully! Old data removed and replaced with new data from csv!")
