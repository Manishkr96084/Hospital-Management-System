from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Department, User, UserRole
from app.schemas.schemas import DepartmentCreate, DepartmentResponse
from app.auth.deps import RoleChecker

router = APIRouter(prefix="/departments", tags=["Departments"])

@router.get("", response_model=List[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()

@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    dept_in: DepartmentCreate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    existing = db.query(Department).filter(Department.name == dept_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department with this name already exists")
        
    dept = Department(
        name=dept_in.name,
        code=dept_in.code.upper(),
        description=dept_in.description,
        icon=dept_in.icon or "Stethoscope"
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept
