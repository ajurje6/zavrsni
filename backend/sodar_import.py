import pandas as pd
from datetime import datetime
import requests
import sys
import os
import subprocess

def download_file(date_str, url_template, local_filename):
    url = url_template.format(date=date_str)
    response = requests.get(url)
    response.raise_for_status()
    with open(local_filename, "w") as f:
        f.write(response.text)
    return local_filename

def parse_to_line_protocol(filepath):
    df = pd.read_csv(filepath, skiprows=12, sep=r"\s+", engine="python")
    df = df.reset_index()
    df["datetime"] = df["index"].astype(str) + " " + df["time"]
    df = df[["datetime", "z", "speed", "dir"]].dropna()
    df["speed"] = df["speed"].replace("*", 0).astype(float)
    df["dir"] = df["dir"].replace("*", 0).astype(float)
    df["timestamp"] = df["datetime"].apply(lambda x: int(datetime.strptime(x, "%Y-%m-%d %H:%M:%S").timestamp() * 1e9))
    lines = df.apply(lambda row: f"sodar,height={int(row['z'])} speed={row['speed']},direction={row['dir']} {row['timestamp']}", axis=1)
    output_path = f"/home/antoniojurjevic/zavrsni/backend/data/sodar/{datetime.now().strftime('%Y%m%d%H%M%S')}.lp"
    with open(output_path, "w") as f:
        f.write("\n".join(lines))
    return output_path

def write_to_influx(lp_file, bucket="sodar_data", org="FESB"):
    result = subprocess.run([
        "influx", "write",
        "--bucket", bucket,
        "--org", org,
        "--file", lp_file
    ], capture_output=True, text=True)
    if result.returncode != 0:
        print("Error writing to InfluxDB:", result.stderr)
    else:
        print("Data written successfully.")

if __name__ == "__main__":
    date_arg = datetime.now().strftime("%y%m%d")

    date_formatted = f"20{date_arg[:2]}-{date_arg[2:4]}-{date_arg[4:]}"
    url_template = "https://meteo777.pythonanywhere.com/sodar/data/{date}.txt"
    local_txt = f"/home/antoniojurjevic/zavrsni/backend/data/sodar/{date_arg}.txt"

    try:
        print("Downloading file...")
        downloaded = download_file(date_arg, url_template, local_txt)
        print("Parsing to Line Protocol...")
        lp_path = parse_to_line_protocol(downloaded)
        print("Writing to InfluxDB...")
        write_to_influx(lp_path)
    except Exception as e:
        print("An error occurred:", e)
