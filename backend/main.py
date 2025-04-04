import os
import time
from fastapi import FastAPI, Query
from datetime import datetime, timedelta
import aiohttp
import requests
import pandas as pd
import logging
import asyncio
from models import BarometerData
from fastapi import Depends
from crud import add_barometer_data
from fastapi.middleware.cors import CORSMiddleware
from database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func
from sqlalchemy.future import select
app = FastAPI()

# Enables CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configures logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Track last modified times of files
last_modified_times = {}
BASE_URL = "https://meteo777.pythonanywhere.com/sodar/data/"
#SODAR
def safe_float(value):
    try:
        return float(value)
    except ValueError:
        return None  # Return None or any default value you prefer

# Fetch SODAR data within the specified date range
async def fetch_sodar_data(start_date, end_date):
    all_data = []
    current_date = start_date

    # Create a session for aiohttp
    async with aiohttp.ClientSession() as session:
        # List of tasks for concurrent fetching
        tasks = []

        # Loop through dates from start_date to end_date
        while current_date <= end_date:
            yymmdd = current_date.strftime("%y%m%d")
            url = f"{BASE_URL}{yymmdd}.txt"

            # Create an asynchronous request task
            tasks.append(fetch_data_for_date(session, url, all_data))

            # Move to the next day
            current_date += timedelta(days=1)

        # Run all tasks concurrently
        await asyncio.gather(*tasks)

    print(f"Total entries collected: {len(all_data)}")  # Debug output
    return all_data

# Fetch data for a specific date
async def fetch_data_for_date(session, url, all_data):
    try:
        async with session.get(url) as response:
            print(f"Fetching {url}...")
            print(f"Response status: {response.status}")

            if response.status == 200:
                text = await response.text()
                lines = text.splitlines()
                header_found = False

                for line in lines:
                    if "time" in line and "z" in line:
                        header_found = True
                        continue

                    if header_found:
                        parts = line.split()
                        if len(parts) >= 4:
                            all_data.append({
                                "time": f"{parts[0]} {parts[1]}",  # Date + Time
                                "height": safe_float(parts[2]),  # Height
                                "speed": safe_float(parts[3]),  # Wind Speed
                                "direction": safe_float(parts[4]),  # Wind Direction
                            })
    except Exception as e:
        print(f"Failed to fetch {url}: {e}")

@app.get("/sodar-data")
async def get_sodar_data():
    start_date = datetime(2025, 1, 3)  # Start date: 2025-01-03
    end_date = datetime(2025, 3, 4)  # End date: 2025-03-04
    data = await fetch_sodar_data(start_date, end_date)
    return data

@app.get("/sodar-summary")
async def get_sodar_summary():
    start_date = datetime(2025, 1, 3)
    end_date = datetime(2025, 3, 4)
    raw_data = await fetch_sodar_data(start_date, end_date)

    # Group data by date
    grouped = {}
    for entry in raw_data:
        date_str = entry["time"].split(" ")[0]
        speed = entry.get("speed")
        direction = entry.get("direction")

        # Skip invalid entries (non-numeric values)
        try:
            speed = float(speed)
            direction = float(direction)
        except (ValueError, TypeError):
            continue

        grouped.setdefault(date_str, []).append({"speed": speed, "direction": direction})

    # Generate full date range from start_date to end_date
    all_dates = []
    current = start_date
    while current <= end_date:
        all_dates.append(current.strftime("%Y-%m-%d"))
        current += timedelta(days=1)

    summary = []
    for date in all_dates:
        entries = grouped.get(date, [])
        
        # Handle case where no valid data exists for this date
        if entries:
            speeds = [e["speed"] for e in entries]
            directions = [e["direction"] for e in entries]

            summary.append({
                "date": date,
                "max_speed": max(speeds),
                "min_speed": min(speeds),
                "avg_speed": sum(speeds) / len(speeds),
                "avg_direction": sum(directions) / len(directions),
            })
        else:
            # If no valid data for this date, use None for the stats
            summary.append({
                "date": date,
                "max_speed": None,
                "min_speed": None,
                "avg_speed": None,
                "avg_direction": None,
            })

    # Sort by date in ascending order
    summary.sort(key=lambda x: x["date"])

    return {
        "data": summary,
    }


#BAROMETER
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


def parse_all_txt(folder_path):
    all_data = []
    for filename in os.listdir(folder_path):
        if filename.endswith(".txt"):  # Makes sure the file is a .txt file
            file_path = os.path.join(folder_path, filename)
            logger.info(f"Processing file: {filename}")
            try:
                df = parse_txt(file_path)
                all_data.extend(df.to_dict(orient="records"))  # Adds data from each file
            except Exception as e:
                logger.error(f"Error processing file {filename}: {e}")  # Logs the error
    return all_data


async def store_data_in_db():
    folder_path = "./data/bakar-mikrobarometar"
    from database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        for filename in os.listdir(folder_path):
            if filename.endswith(".txt"):
                file_path = os.path.join(folder_path, filename)

                 # Check if file was modified since last check
                last_modified = os.path.getmtime(file_path)
                if filename not in last_modified_times or last_modified_times[filename] != last_modified:
                    last_modified_times[filename] = last_modified  # Update last modified time
                    df = parse_txt(file_path)  # Your parsing function
                    # Insert new/updated data into the database
                    for _, row in df.iterrows():
                        await add_barometer_data(db, row["datetime"], row["pressure"])

                    logger.info(f"Data from {filename} stored in the database.")
                else:
                    logger.info(f"No changes detected in {filename}, skipping.")
    
    logger.info("Data storage complete.")

@app.get("/data")
def get_data(date: str = Query(None, alias="date", description="Date to filter data by (YYYY-MM-DD)")):
    folder_path = "./data/bakar-mikrobarometar"  # Folder where .txts are stored
    data = parse_all_txt(folder_path)  # Gets data from all files

    # Apply filtering only if a date is provided
    if date:
        try:
            filter_date = pd.to_datetime(date)
            data = [entry for entry in data if pd.to_datetime(entry["datetime"]).date() == filter_date.date()]
            logger.info(f"Filtering data for {date}, {len(data)} records found")
        except Exception as e:
            logger.error(f"Invalid date format provided: {date}, Error: {e}")
            return {"error": "Invalid date format. Use YYYY-MM-DD."}

    # Ensure the pressure values are treated as floats
    if data:
        pressures = [
            float(entry["pressure"].strip("[]")) if isinstance(entry["pressure"], str) else float(entry["pressure"])
            for entry in data if entry["pressure"] is not None
        ]

        # Calculate min, max, and avg pressure
        if pressures:
            min_pressure = min(pressures)
            max_pressure = max(pressures)
            avg_pressure = sum(pressures) / len(pressures)
        else:
            min_pressure = None
            max_pressure = None
            avg_pressure = None
    else:
        min_pressure = None
        max_pressure = None
        avg_pressure = None

    logger.info(f"Returning {len(data)} records with min: {min_pressure}, max: {max_pressure}, avg: {avg_pressure}")

    return {
        "data": data,
        "summary": {
            "min_pressure": min_pressure,
            "max_pressure": max_pressure,
            "avg_pressure": avg_pressure
        }
    }

@app.get("/stacked-graph")
async def get_stacked_graph_data(
    date: str = Query(None, alias="date", description="Date to filter data by (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db)
):
    try:
        # Parse the date parameter if it's provided
        if date:
            try:
                filter_date = pd.to_datetime(date).date()  # Extract only the date part
                logger.info(f"Filtering data for {date}")
            except Exception as e:
                logger.error(f"Invalid date format provided: {date}, Error: {e}")
                return {"error": "Invalid date format. Use YYYY-MM-DD."}

        # Constructing the query to fetch avg, min, and max pressure for each date
        query = select(
            func.date(BarometerData.datetime).label("date"),  # Extracting the date part from TIMESTAMP
            func.avg(BarometerData.pressure).label("avg_pressure"),
            func.min(BarometerData.pressure).label("min_pressure"),
            func.max(BarometerData.pressure).label("max_pressure")
        ).group_by(func.date(BarometerData.datetime))  # Group by the date part

        # Apply date filtering if a date is provided
        if date:
            query = query.filter(func.date(BarometerData.datetime) == filter_date)

        # Execute the query and fetch the results asynchronously
        result = await db.execute(query)

        # If no data is found
        records = result.all()
        if not records:
            logger.info("No data found for the selected date range.")
            return {"error": "No data available for the selected date"}

        # Prepare data for the stacked graph
        stacked_graph_data = [
            {"date": record.date, "avg_pressure": record.avg_pressure, "min_pressure": record.min_pressure, "max_pressure": record.max_pressure}
            for record in records
        ]

        logger.info(f"Returning stacked graph data for {len(stacked_graph_data)} records.")
        
        return {"data": stacked_graph_data}

    except Exception as e:
        logger.error(f"Error fetching data for stacked graph: {e}")
        return {"error": "Error fetching data for the stacked graph."}

@app.on_event("startup")
async def startup_event():
   pass  # Don't trigger on startup now, it should be manually called or scheduled

# To run the server, use the command: uvicorn main:app --reload 