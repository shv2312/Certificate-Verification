"""
app/routes/programmes.py
========================
Endpoints providing authoritative degree programmes, branches, and specializations
stored in the institutional database.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models import Programme, Branch
from app.schemas.common import APIResponse

router = APIRouter(prefix="/api/v1/programmes", tags=["Programmes"])
metadata_router = APIRouter(prefix="/api/v1/metadata", tags=["Metadata"])


@router.get("/branches")
@metadata_router.get("/courses")
async def get_programmes_and_branches(db: AsyncSession = Depends(get_db)):
    """
    Returns all registered degree programmes and branches grouped by degree code.
    Used by the candidate form (Step 3) to dynamically populate the Specialization dropdown.
    """
    result_prog = await db.execute(select(Programme).order_by(Programme.id))
    programmes = result_prog.scalars().all()

    result_branches = await db.execute(select(Branch).order_by(Branch.id))
    branches = result_branches.scalars().all()

    branches_by_programme_id = {}
    for b in branches:
        branches_by_programme_id.setdefault(b.programme_id, []).append({
            "id": b.id,
            "code": b.code,
            "name": b.full_name,
        })

    branches_by_degree = {}
    programme_list = []

    for p in programmes:
        b_list = branches_by_programme_id.get(p.id, [])
        programme_list.append({
            "id": p.id,
            "code": p.code,
            "full_name": p.full_name,
            "degree_type": p.degree_type,
            "branches": b_list,
        })
        branches_by_degree[p.code] = [b["name"] for b in b_list]
        if p.degree_type and p.degree_type not in branches_by_degree:
            branches_by_degree[p.degree_type] = [b["name"] for b in b_list]

    return APIResponse(
        success=True,
        message="Programmes and branches fetched successfully.",
        data={
            "programmes": programme_list,
            "branches_by_degree": branches_by_degree,
        },
    )
