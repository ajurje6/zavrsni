from fastapi import FastAPI, Query
import pandas as pd
import os
from fastapi.middleware.cors import CORSMiddleware
import logging

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


# To run the server, use the command: uvicorn main:app --reload 
