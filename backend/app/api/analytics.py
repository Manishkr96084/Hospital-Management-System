from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.schemas import AnalyticsOverviewResponse
from app.services.analytics_service import get_hospital_analytics
from app.auth.deps import RoleChecker
from app.models.models import User, UserRole

router = APIRouter(prefix="/analytics", tags=["Analytics & Forecasts"])

@router.get("/overview", response_model=AnalyticsOverviewResponse)
def get_analytics_overview(
    current_user: User = Depends(RoleChecker([
        UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, 
        UserRole.RECEPTIONIST, UserRole.BILLING_STAFF, UserRole.PHARMACIST, UserRole.LAB_STAFF
    ])),
    db: Session = Depends(get_db)
):
    return get_hospital_analytics(db)
