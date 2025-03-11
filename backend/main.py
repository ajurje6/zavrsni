from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db  # Assuming this is your database session dependency
from crud import add_barometer_data, get_data_by_date
import pandas as pd
import os
import logging
from datetime import datetime

app = FastAPI()

# General logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Enable detailed SQLAlchemy logging
logging.getLogger("sqlalchemy.engine").setLevel(logging.DEBUG)
logging.getLogger("sqlalchemy.dialects").setLevel(logging.DEBUG)
logging.getLogger("sqlalchemy.pool").setLevel(logging.DEBUG)

# Function to parse .txt files into DataFrame
def parse_txt(file_path):
    try:
        # Try to read the file assuming the values are separated by spaces
        try:
            df = pd.read_csv(file_path, sep=r'\s+', header=None,
                             names=["year", "month", "day", "hour", "minute", "second", "pressure"])
        except Exception as e:
            logger.warning(f"Space-separated parsing failed for {file_path}: {e}")
            # If space-separated parsing fails, try reading with a different separator
            df = pd.read_csv(file_path, header=None,
                             names=["year", "month", "day", "hour", "minute", "second", "pressure"])

        # Combine year, month, day, hour, minute, second into a single datetime string
        df["datetime"] = df.apply(
            lambda row: f"{int(row['year']):04d}-{int(row['month']):02d}-{int(row['day']):02d} "
                        f"{int(row['hour']):02d}:{int(row['minute']):02d}:{int(row['second']):02d}",
            axis=1
        )

        # Parse the datetime string into pandas datetime object
        df["datetime"] = pd.to_datetime(df["datetime"], format="%Y-%m-%d %H:%M:%S", errors='coerce', dayfirst=False)

        # Remove rows where the datetime couldn't be parsed
        df = df.dropna(subset=["datetime"])

        # Keep only datetime and pressure columns
        df = df[["datetime", "pressure"]]

        return df

    except Exception as e:
        logger.error(f"Error processing file {file_path}: {e}")
        return pd.DataFrame(columns=["datetime", "pressure"])  # Return empty DataFrame on error

# Function to store parsed data in the database
async def store_data_in_db(file_path, db: AsyncSession):
    df = parse_txt(file_path)  # Parse the file
    logger.info(f"Parsed data from {file_path}: {df.head()}")  # Log the first few rows
    for _, row in df.iterrows():
        await add_barometer_data(db, row["datetime"], row["pressure"])

# Endpoint to retrieve barometer data by date
@app.get("/data")
async def get_data(date: str = "2025-03-01", db: AsyncSession = Depends(get_db)):
    data = await get_data_by_date(db, date)
    return {"data": data}

