import uuid
from datetime import datetime, date
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, Date, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.core.database import Base

if TYPE_CHECKING:
    from app.apps.beneficiaries.models import BeneficiaryProfile
    from app.apps.users.models import User


class VisitStatus(str, enum.Enum):
    """Status of a scheduled visit"""
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    MISSED = "missed"


class VisitPriority(str, enum.Enum):
    """Priority level for visits"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class Visit(Base):
    """Scheduled visits by ASHA workers to beneficiaries"""
    __tablename__ = "visits"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    beneficiary_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("beneficiary_profiles.id", ondelete="CASCADE"), 
        nullable=False
    )
    
    asha_worker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False
    )
    
    # Visit scheduling details
    scheduled_date: Mapped[date] = mapped_column(Date, nullable=False)
    scheduled_time: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # e.g., "10:00 AM"
    
    # Visit type and purpose
    visit_type: Mapped[str] = mapped_column(
        String(50), 
        default='routine_checkup'
    )  # routine_checkup, immunization, anc_visit, pnc_visit, counseling, emergency
    
    purpose: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Status tracking
    status: Mapped[VisitStatus] = mapped_column(
        Enum(VisitStatus, values_callable=lambda x: [e.value for e in x]), 
        default=VisitStatus.SCHEDULED
    )
    priority: Mapped[VisitPriority] = mapped_column(
        Enum(VisitPriority, values_callable=lambda x: [e.value for e in x]), 
        default=VisitPriority.NORMAL
    )
    
    # Completion details
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    health_log_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("health_logs.id", ondelete="SET NULL"), 
        nullable=True
    )  # Link to health log created during visit
    
    # Audit fields
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    beneficiary: Mapped["BeneficiaryProfile"] = relationship("BeneficiaryProfile", backref="visits")
    asha_worker: Mapped["User"] = relationship("User", foreign_keys=[asha_worker_id])
    
    def __repr__(self):
        return f"<Visit {self.id} - {self.beneficiary_id} on {self.scheduled_date}>"
