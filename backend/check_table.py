import asyncio
import asyncpg
async def main():
    conn = await asyncpg.connect('postgresql://postgres:SabarishSheena%407883@127.0.0.1:5432/siet_verification')
    row = await conn.fetchval("SELECT to_regclass('public.email_challenges')")
    print('Table email_challenges exists:', row is not None)
    await conn.close()
asyncio.run(main())
