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
from database import AsyncSessionLocal
import matplotlib.pyplot as plt
import io
import base64
from fastapi.responses import Response
from io import BytesIO
import matplotlib.cm as cm
import matplotlib.colors as mcolors
import numpy as np
from influxdb_client import InfluxDBClient
from matplotlib.dates import date2num
from zoneinfo import ZoneInfo
import matplotlib
import time
from typing import Any
matplotlib.use("Agg")

app = FastAPI()

# Enables CORS for frontend, all origins allowed for now
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

INFLUX_URL = os.getenv("INFLUX_URL")
INFLUX_TOKEN = os.getenv("INFLUX_TOKEN")
INFLUX_ORG = os.getenv("INFLUX_ORG")
INFLUX_BUCKET = os.getenv("INFLUX_BUCKET")

# Global variables for Influx client and query api
client: InfluxDBClient = None
query_api = None

@app.get("/sodar-data")
async def get_sodar_data(date: str = Query(..., description="Format: YYYY-MM-DD")):
    try:
        start_time = datetime.strptime(date, "%Y-%m-%d")
        end_time = start_time + timedelta(days=1)

        query = f'''
        from(bucket: "{INFLUX_BUCKET}")
          |> range(start: {start_time.isoformat()}Z, stop: {end_time.isoformat()}Z)
          |> filter(fn: (r) => r._measurement == "sodar")
          |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
          |> keep(columns: ["_time", "height", "speed", "direction"])
        '''

        df = query_api.query_data_frame(query)

        if df.empty:
            return []

        df["_time"] = pd.to_datetime(df["_time"])
        df = df.dropna(subset=["speed", "direction", "height"])
        df["height"] = df["height"].astype(float)
        df = df.sort_values(by=["_time", "height"])

        result = [
            {
                "time": row["_time"].strftime("%Y-%m-%d %H:%M"),
                "height": row["height"],
                "speed": float(row["speed"]),
                "direction": float(row["direction"]),
            }
            for _, row in df.iterrows()
        ]

        return result

    except Exception as e:
        logger.error(f"Error in get_sodar_data: {e}")
        return {"error": str(e)}

# Cache variables
summary_cache: dict[str, Any] = {"timestamp": 0, "data": None}
CACHE_TTL_SECONDS = 1200

@app.get("/sodar-summary")
async def get_sodar_summary():
    global summary_cache
    now = time.time()

    # Return cached data if within TTL
    if summary_cache["data"] and (now - summary_cache["timestamp"]) < CACHE_TTL_SECONDS:
        return {"data": summary_cache["data"]}

    try:
        query = f'''
        from(bucket: "{INFLUX_BUCKET}")
          |> range(start: 0)
          |> filter(fn: (r) => r._measurement == "sodar")
          |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
          |> keep(columns: ["_time", "speed", "direction"])
        '''

        df = query_api.query_data_frame(query)
        if df.empty:
            return {"data": []}

        df["_time"] = pd.to_datetime(df["_time"])
        df["date"] = df["_time"].dt.date
        df = df.dropna(subset=["speed", "direction"])
        df["speed"] = df["speed"].astype(float)
        df["direction"] = df["direction"].astype(float)
        df = df[df["speed"] > 0]

        grouped = df.groupby("date")

        summary = []
        for date, group in grouped:
            speeds = group["speed"]
            directions = group["direction"]
            summary.append({
                "date": str(date),
                "max_speed": speeds.max(),
                "min_speed": speeds.min(),
                "avg_speed": speeds.mean(),
                "avg_direction": directions.mean()
            })

        summary.sort(key=lambda x: x["date"])
        summary_cache = {"timestamp": now, "data": summary}
        return {"data": summary}

    except Exception as e:
        logger.error(f"Error in get_sodar_summary: {e}")
        return {"error": str(e)}

@app.get("/sodar-plot")
def generate_sodar_plot(date: str = Query(..., description="Date in YYYY-MM-DD format")):
    try:
        start_dt = datetime.strptime(date, "%Y-%m-%d")
        end_dt = start_dt + timedelta(days=1)
    except ValueError:
        return Response(content="Invalid date format", status_code=400)

    try:
        query = f'''
        from(bucket: "{INFLUX_BUCKET}")
          |> range(start: {start_dt.isoformat()}Z, stop: {end_dt.isoformat()}Z)
          |> filter(fn: (r) => r._measurement == "sodar")
          |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
          |> keep(columns: ["_time", "height", "speed", "direction"])
        '''

        result = query_api.query_data_frame(query)
        if result.empty:
            return Response(content="No data available", status_code=404)

        result['_time'] = pd.to_datetime(result['_time'])
        result['height'] = result['height'].astype(float)
        result = result.sort_values(by=['_time', 'height'])

        # Convert time to matplotlib float format
        result['matplotlib_time'] = result['_time'].map(lambda x: date2num(x))

        local_time = result['_time'].max()
        last_fetched = local_time.strftime("%Y-%m-%d %H:%M:%S")

        fig, ax = plt.subplots(figsize=(17, 8))
        cmap = cm.jet
        norm = mcolors.Normalize(vmin=0, vmax=40)

        x = result['matplotlib_time'].values
        y = result['height'].values
        speed = result['speed'].values
        direction = result['direction'].values

        u = speed * np.sin(np.radians(direction - 180))
        v = speed * np.cos(np.radians(direction - 180))

        q = ax.quiver(x, y, u / speed, v / speed, speed, cmap=cmap, norm=norm, angles='uv', scale=50, width=0.0015)

        ax.set_ylabel("Height [m]")
        ax.set_xlabel("Time")
        ax.set_title(f"SODAR Wind Profile\nData last fetched at: {last_fetched}")
        ax.grid(True)
        ax.xaxis_date()
        fig.autofmt_xdate()

        sm = cm.ScalarMappable(cmap=cmap, norm=norm)
        sm.set_array(speed)
        cbar = fig.colorbar(sm, ax=ax, orientation='vertical')
        cbar.set_label("Wind Speed [m/s]")

        buf = BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight', dpi=150)
        plt.close(fig)
        buf.seek(0)
        return Response(content=buf.read(), media_type="image/png")

    except Exception as e:
        logger.error(f"Error in generate_sodar_plot: {e}")
        return Response(content=f"Error generating plot: {e}", status_code=500)

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
def startup_event():
    global client, query_api
    client = InfluxDBClient(
        url=INFLUX_URL,
        token=INFLUX_TOKEN,
        org=INFLUX_ORG,
        verify_ssl=False
    )
    query_api = client.query_api()
    logger.info("InfluxDB client initialized")
# To run the server, use the command: source venv/bin/activate python -m uvicorn main:app --reload WIN:.\venv\Scripts\python.exe -m uvicorn main:app --reload
