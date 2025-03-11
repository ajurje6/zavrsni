from sqlalchemy import Column, Integer, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class BarometerData(Base):
    __tablename__ = "barometer_data"

    id = Column(Integer, primary_key=True, index=True)
    datetime = Column(DateTime, index=True)
    pressure = Column(Float)
