from typing import Optional
from sqlalchemy.orm import Session
from app.models.models import Notification

def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    type: str = "INFO",  # INFO, SUCCESS, WARNING, CRITICAL
    link: Optional[str] = None
) -> Optional[Notification]:
    try:
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            link=link
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification
    except Exception as e:
        db.rollback()
        print(f"Error creating notification: {e}")
        return None
