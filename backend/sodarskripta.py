import pandas as pd
import requests
from influxdb_client import InfluxDBClient, Point, WriteOptions
from influxdb_client.client.write_api import SYNCHRONOUS
from datetime import datetime
from io import StringIO
from dotenv import load_dotenv
import os
# ---------- KONFIGURACIJA -----------------
URL_TEMPLATE = "https://meteo777.pythonanywhere.com/sodar/data/{filename}.txt"
FILE_DATE = "250417"  # npr. 04. ožujka 2025. -> 250304
INFLUX_URL = os.getenv("INFLUX_URL")
INFLUX_TOKEN = os.getenv("INFLUX_TOKEN")
INFLUX_ORG = os.getenv("INFLUX_ORG")
INFLUX_BUCKET = os.getenv("INFLUX_BUCKET")
# ------------------------------------------

def fetch_data(file_date):
    url = URL_TEMPLATE.format(filename=file_date)
    response = requests.get(url)
    response.raise_for_status()
    return response.text

def parse_data(text):
    lines = text.strip().split("\n")

    header_line = lines[12].strip().split("\t")
    data_lines = lines[13:]

    df_all = pd.read_csv(
        StringIO("\n".join(data_lines)),
        sep="\t",
        header=None,
        names=header_line,
        engine="python"
    )

    # Zadrži samo željene kolone
    df = df_all[["time", "z", "speed", "dir"]]

    # Filtriraj redove s nevaljanim vrijednostima
    df = df[(df["speed"] != "*") & (df["dir"] != "*")]
    df = df.dropna(subset=["speed", "dir"])

    # Pretvori speed i dir u float
    df["speed"] = df["speed"].astype(float)
    df["dir"] = df["dir"].astype(float)

    # Pretvaranje "time" kolone u datetime objekt
    df.loc[:, "datetime"] = pd.to_datetime(df["time"], format="%Y-%m-%d %H:%M:%S", errors="coerce")
    df = df.dropna(subset=["datetime"])

    # Debug ispis
    print(f"[DEBUG] Ukupan broj redova nakon čišćenja: {len(df)}")
    print(df.head())

    return df

def write_to_influx(df):
    client = InfluxDBClient(url=INFLUX_URL, token=INFLUX_TOKEN, org=INFLUX_ORG)
    write_api = client.write_api(write_options=SYNCHRONOUS)

    for _, row in df.iterrows():
        # Debug ispis prije slanja
        print(f"[DEBUG] Writing point -> time: {row['datetime']}, z: {row['z']}, speed: {row['speed']}, dir: {row['dir']}")

        point = (
            Point("wind_profile")
            .tag("source", "sodar")
            .tag("height_m", str(int(row["z"])))
            .field("speed", float(row["speed"]))
            .field("direction", float(row["dir"]))
            .time(row["datetime"])  # koristi puni datetime
        )
        write_api.write(bucket=INFLUX_BUCKET, org=INFLUX_ORG, record=point)

    client.close()

# ---------- GLAVNI POZIV ----------
try:
    raw_text = fetch_data(FILE_DATE)

    # Spremi sirovi tekst u datoteku za provjeru
    with open("sirovi_podaci.txt", "w", encoding="utf-8") as f:
        f.write(raw_text)

    df = parse_data(raw_text)
    write_to_influx(df)
    print("✅ Podaci za", FILE_DATE, "uspješno spremljeni u InfluxDB.")
except Exception as e:
    print(f"⚠️ Greška: {e}")

