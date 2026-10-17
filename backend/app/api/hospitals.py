from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Hospital, Branch, Floor, Ward, Room, Bed, User, UserRole
from app.schemas.schemas import (
    HospitalResponse, HospitalCreate,
    BranchResponse, BranchCreate,
    FloorResponse, FloorCreate,
    WardResponse, WardCreate,
    RoomResponse, RoomCreate
)
from app.auth.deps import RoleChecker, get_current_active_user
from app.services.audit_service import log_audit

router = APIRouter(prefix="/hospitals", tags=["Hospital & Branch Hierarchy"])

@router.get("/", response_model=List[HospitalResponse])
def get_hospitals(db: Session = Depends(get_db)):
    return db.query(Hospital).all()

@router.post("/", response_model=HospitalResponse)
def create_hospital(
    data: HospitalCreate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    h = Hospital(**data.model_dump())
    db.add(h)
    db.commit()
    db.refresh(h)
    log_audit(db, "CREATE_HOSPITAL", "Hospital", str(h.id), user=current_user)
    return h

@router.get("/branches", response_model=List[BranchResponse])
def get_branches(hospital_id: int = None, db: Session = Depends(get_db)):
    query = db.query(Branch)
    if hospital_id:
        query = query.filter(Branch.hospital_id == hospital_id)
    return query.all()

@router.post("/branches", response_model=BranchResponse)
def create_branch(
    data: BranchCreate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    b = Branch(**data.model_dump())
    db.add(b)
    db.commit()
    db.refresh(b)
    log_audit(db, "CREATE_BRANCH", "Branch", str(b.id), user=current_user)
    return b

@router.get("/floors", response_model=List[FloorResponse])
def get_floors(branch_id: int = None, db: Session = Depends(get_db)):
    q = db.query(Floor)
    if branch_id:
        q = q.filter(Floor.branch_id == branch_id)
    return q.all()

@router.post("/floors", response_model=FloorResponse)
def create_floor(
    data: FloorCreate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    f = Floor(**data.model_dump())
    db.add(f)
    db.commit()
    db.refresh(f)
    return f

@router.get("/wards", response_model=List[WardResponse])
def get_wards(branch_id: int = None, db: Session = Depends(get_db)):
    q = db.query(Ward)
    if branch_id:
        q = q.filter(Ward.branch_id == branch_id)
    return q.all()

@router.post("/wards", response_model=WardResponse)
def create_ward(
    data: WardCreate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    w = Ward(**data.model_dump())
    db.add(w)
    db.commit()
    db.refresh(w)
    return w

@router.get("/rooms", response_model=List[RoomResponse])
def get_rooms(ward_id: int = None, db: Session = Depends(get_db)):
    q = db.query(Room)
    if ward_id:
        q = q.filter(Room.ward_id == ward_id)
    return q.all()

@router.post("/rooms", response_model=RoomResponse)
def create_room(
    data: RoomCreate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    r = Room(**data.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return r
