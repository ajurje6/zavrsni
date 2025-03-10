from fastapi import FastAPI
import pandas as pd
import os
from fastapi.middleware.cors import CORSMiddleware
import logging

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def parse_txt(file_path):
    try:
        # Try to read the file assuming space-separated values
        try:
            df = pd.read_csv(file_path, sep='\s+', header=None,
                             names=["year", "month", "day", "hour", "minute", "second", "pressure"])
        except Exception as e:
            logger.warning(f"Space-separated parsing failed for {file_path}: {e}")
            # If space-separated parsing fails, try reading with a different separator (e.g., comma or no separator)
            df = pd.read_csv(file_path, header=None,
                             names=["year", "month", "day", "hour", "minute", "second", "pressure"])

        # Combine year, month, day, hour, minute, second into a single datetime string
        df["datetime"] = df.apply(
            lambda row: f"{int(row['year']):04d}-{int(row['month']):02d}-{int(row['day']):02d} "
                        f"{int(row['hour']):02d}:{int(row['minute']):02d}:{int(row['second']):02d}",
            axis=1
        )

        # Parse the datetime string into a pandas datetime object
        df["datetime"] = pd.to_datetime(df["datetime"], format="%Y-%m-%d %H:%M:%S", errors='coerce', dayfirst=False)

        # Remove rows where the datetime couldn't be parsed
        df = df.dropna(subset=["datetime"])

        # Keep only datetime and pressure columns
        df = df[["datetime", "pressure"]]

        return df

    except Exception as e:
        logger.error(f"Error processing file {file_path}: {e}")
        return pd.DataFrame(columns=["datetime", "pressure"])  # Return empty DataFrame on error


def parse_all_txt(folder_path):
    all_data = []
    for filename in os.listdir(folder_path):
        if filename.endswith(".txt"):  # Make sure the file is a .txt file
            file_path = os.path.join(folder_path, filename)
            logger.info(f"Processing file: {filename}")
            try:
                df = parse_txt(file_path)
                all_data.extend(df.to_dict(orient="records"))  # Add data from each file
            except Exception as e:
                logger.error(f"Error processing file {filename}: {e}")  # Log the error
    return all_data

@app.get("/data")
def get_data():
    folder_path = "./data/bakar-mikrobarometar"  # Folder where your TXT files are stored
    data = parse_all_txt(folder_path)  # Get data from all files
    logger.info(f"Returning {len(data)} records")
    return {"data": data}  # Return data in JSON format

# To run the server, use the command: uvicorn main:app --reload
