import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, Boolean, Enum, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY

from app.core.database import Base

if TYPE_CHECKING:
    from app.apps.beneficiaries.models import BeneficiaryProfile
    from app.apps.users.models import User


class HealthLog(Base):
    """Health logs - clinical visits and health data recorded by ASHA workers or self-reported"""
    __tablename__ = "health_logs"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    beneficiary_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("beneficiary_profiles.id", ondelete="CASCADE"), 
        nullable=False
    )
    recorded_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id"), 
        nullable=True
    )
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    vitals: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # { bpSystolic, bpDiastolic }
    bp_systolic: Mapped[Optional[int]] = mapped_column(nullable=True)
    bp_diastolic: Mapped[Optional[int]] = mapped_column(nullable=True)
    symptoms: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String), nullable=True)
    mood: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    voice_note_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_emergency: Mapped[bool] = mapped_column(Boolean, default=False)
    visit_type: Mapped[str] = mapped_column(String(50), default='home')
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    
    # Relationships
    beneficiary: Mapped["BeneficiaryProfile"] = relationship("BeneficiaryProfile", back_populates="health_logs")
    recorder: Mapped[Optional["User"]] = relationship("User", foreign_keys=[recorded_by])
    
    def __repr__(self):
        return f"<HealthLog {self.id} for {self.beneficiary_id}>"
