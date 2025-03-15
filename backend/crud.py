from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.sql import func
from models import BarometerData


async def add_barometer_data(db: AsyncSession, datetime_value, pressure_value):
    try:
        # Check if the record already exists
        query = select(BarometerData).where(BarometerData.datetime == datetime_value)
        result = await db.execute(query)
        existing_entry = result.scalar_one_or_none()

        if existing_entry is None:
            # Insert only if the record does not exist
            new_entry = BarometerData(datetime=datetime_value, pressure=pressure_value)
            db.add(new_entry)

    except Exception as e:
        await db.rollback()

async def get_data_by_date(db: AsyncSession, date):
    try:
        query = select(BarometerData).where(func.date(BarometerData.datetime) == date)
        result = await db.execute(query)
        data = result.scalars().all()
        return data
    except Exception as e:
        return []
