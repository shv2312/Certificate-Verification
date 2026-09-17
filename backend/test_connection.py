import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.config import get_settings

async def check():
    try:
        engine = create_async_engine(get_settings().DATABASE_URL)
        async with engine.connect() as conn:
            print("Connection successful to DATABASE_URL")
            
        test_engine = create_async_engine(get_settings().DATABASE_URL.replace("siet_verification", "siet_test"))
        async with test_engine.connect() as conn:
            print("Connection successful to test db")
    except Exception as e:
        print(f"Connection failed: {e.__class__.__name__} - {str(e)}")

if __name__ == "__main__":
    asyncio.run(check())
