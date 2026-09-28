import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect('postgresql://postgres:SabarishSheena%407883@127.0.0.1:5432/siet_verification')
    branches_cols = await conn.fetch(
        "SELECT column_name FROM information_schema.columns WHERE table_name='branches' ORDER BY ordinal_position"
    )
    programmes_cols = await conn.fetch(
        "SELECT column_name FROM information_schema.columns WHERE table_name='programmes' ORDER BY ordinal_position"
    )
    print('branches columns:', [r['column_name'] for r in branches_cols])
    print('programmes columns:', [r['column_name'] for r in programmes_cols])
    await conn.close()

asyncio.run(main())
