from typing import Optional
from sqlalchemy.orm import Session
from app.models.models import AuditLog, User

def log_audit(
    db: Session,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    user: Optional[User] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
):
    try:
        audit = AuditLog(
            user_id=user.id if user else None,
            user_email=user.email if user else "system",
            user_role=user.role.value if user else "SYSTEM",
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            details=details,
            ip_address=ip_address or "127.0.0.1"
        )
        db.add(audit)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error logging audit: {e}")
