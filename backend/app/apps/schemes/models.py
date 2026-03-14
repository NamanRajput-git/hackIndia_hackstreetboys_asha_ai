import uuid
from datetime import datetime, date
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, Date, Enum, ForeignKey, Numeric, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY

from app.core.database import Base
from app.core.types import GUID, StringArray

if TYPE_CHECKING:
    from app.apps.users.models import User
    from app.apps.enrollments.models import Enrollment


class Scheme(Base):
    """Schemes - government and NGO health/welfare schemes"""
    __tablename__ = "schemes"
    
    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    scheme_name: Mapped[str] = mapped_column(String(255), nullable=False)
    provider: Mapped[str] = mapped_column(
        Enum('Govt', 'NGO', name='scheme_provider'), 
        nullable=False
    )
    category: Mapped[str] = mapped_column(
        Enum('financial', 'nutrition', 'health', name='scheme_category'), 
        nullable=False
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    hero_image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    benefits: Mapped[Optional[List[str]]] = mapped_column(StringArray, nullable=True)
    eligibility_criteria: Mapped[Optional[List[str]]] = mapped_column(StringArray, nullable=True)
    target_audience: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # { pregnancyStage, economicStatus, userTypes }
    status: Mapped[str] = mapped_column(
        Enum('active', 'draft', 'closed', name='scheme_status'), 
        default='active'
    )
    budget: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), default=0)
    enrolled_count: Mapped[int] = mapped_column(Integer, default=0)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    microsite_config: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # Custom microsite configuration
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        GUID, 
        ForeignKey("users.id"), 
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Relationships
    creator: Mapped[Optional["User"]] = relationship("User", foreign_keys=[created_by])
    enrollments: Mapped[List["Enrollment"]] = relationship("Enrollment", back_populates="scheme")
    
    def __repr__(self):
        return f"<Scheme {self.scheme_name}>"
