import uuid
from datetime import datetime, date
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, Date, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY

from app.core.database import Base
from app.core.types import GUID, StringArray

if TYPE_CHECKING:
    from app.apps.users.models import User


class DailyLog(Base):
    """Daily logs - self-reported daily health data for period/mood tracking"""
    __tablename__ = "daily_logs"
    
    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID, 
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    mood: Mapped[Optional[str]] = mapped_column(
        Enum('Happy', 'Neutral', 'Sad', 'Tired', 'Anxious', 'Pain', name='mood_type'),
        nullable=True
    )
    symptoms: Mapped[Optional[List[str]]] = mapped_column(StringArray, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    flow: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # 'Light', 'Medium', 'Heavy'
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="daily_logs")
    
    # Unique constraint on user_id + date
    __table_args__ = (
        # UniqueConstraint('user_id', 'date', name='uq_daily_logs_user_date'),
    )
    
    def __repr__(self):
        return f"<DailyLog {self.date} for {self.user_id}>"
