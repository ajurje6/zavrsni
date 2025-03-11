import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.sql import func
from models import BarometerData

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

async def add_barometer_data(db: AsyncSession, datetime_value, pressure_value):
    try:
        new_entry = BarometerData(datetime=datetime_value, pressure=pressure_value)
        db.add(new_entry)
        await db.commit()  # Ensure data is written
        logger.info(f"Inserted: {datetime_value} - {pressure_value}")
    except Exception as e:
        await db.rollback()  # Rollback in case of error
        logger.error(f"Error inserting data: {e}")

async def get_data_by_date(db: AsyncSession, date):
    try:
        query = select(BarometerData).where(func.date(BarometerData.datetime) == date)
        result = await db.execute(query)
        data = result.scalars().all()
        logger.info(f"Retrieved {len(data)} records for date {date}")
        return data
    except Exception as e:
        logger.error(f"Error retrieving data for {date}: {e}")
        return []
