import os
import pandas as pd
import logging
from database import AsyncSessionLocal
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text


# Configures logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def parse_txt(file_path):
    try:
        # Tries to read the file assuming that the values are separated by spaces
        try:
            df = pd.read_csv(file_path, sep=r'\s+', header=None,
                             names=["year", "month", "day", "hour", "minute", "second", "pressure"])
        except Exception as e:
            logger.warning(f"Space-separated parsing failed for {file_path}: {e}")
            # If space-separated parsing fails, tries reading with a different separator
            df = pd.read_csv(file_path, header=None,
                             names=["year", "month", "day", "hour", "minute", "second", "pressure"])

        # Combines year, month, day, hour, minute, second into a single datetime string
        df["datetime"] = df.apply(
            lambda row: f"{int(row['year']):04d}-{int(row['month']):02d}-{int(row['day']):02d} "
                        f"{int(row['hour']):02d}:{int(row['minute']):02d}:{int(row['second']):02d}",
            axis=1
        )

        # Parses the datetime string into a pandas datetime object
        df["datetime"] = pd.to_datetime(df["datetime"], format="%Y-%m-%d %H:%M:%S", errors='coerce', dayfirst=False)

        # Removes rows where the datetime couldn't be parsed
        df = df.dropna(subset=["datetime"])

        # Keeps only datetime and pressure columns
        df = df[["datetime", "pressure"]]

        return df

    except Exception as e:
        logger.error(f"Error processing file {file_path}: {e}")
        return pd.DataFrame(columns=["datetime", "pressure"])  # Return empty DataFrame on error


async def store_seventh_january_data():
    folder_path = "./data/bakar-mikrobarometar"  # Folder where .txt files are stored
    
    async with AsyncSessionLocal() as db:
        for filename in os.listdir(folder_path):
            if filename.endswith(".txt"):  # Process only .txt files
                file_path = os.path.join(folder_path, filename)
                df = parse_txt(file_path)

                # Insert data from 7th January into the database
                if not df.empty:
                    for _, row in df.iterrows():
                        try:
                            # Check if the data already exists for January 7th
                            if row["datetime"].date() == pd.to_datetime("2025-01-07").date():
                                # Check if the data already exists
                                existing_data = await db.execute(
                                    text("SELECT 1 FROM barometer_data WHERE datetime = :datetime"),
                                    {"datetime": row["datetime"]}
                                )
                                
                                if existing_data.fetchone() is None:
                                    await add_barometer_data(db, row["datetime"], row["pressure"])
                                    logger.info(f"Data for January 7th from {filename} stored in the database.")
                                else:
                                    logger.info(f"Data for {row['datetime']} already exists in the database.")
                        
                        except IntegrityError as e:
                            logger.error(f"Integrity error while inserting data: {e}")
    
    logger.info("Data insertion for January 7th complete.")



async def add_barometer_data(db, datetime, pressure):
    try:
        # Convert pressure to float explicitly before passing it to the query
        pressure = float(pressure)  # Ensure the pressure is a float
        
        # Wrap the INSERT query in the `text()` function
        query = text("""
            INSERT INTO barometer_data (datetime, pressure)
            VALUES (:datetime, :pressure)
        """)

        await db.execute(query, {"datetime": datetime, "pressure": pressure})
        await db.commit()

    except Exception as e:
        logger.error(f"Error inserting data: {e}")



if __name__ == "__main__":
    # Call the function to store January 7th data
    import asyncio
    asyncio.run(store_seventh_january_data())

