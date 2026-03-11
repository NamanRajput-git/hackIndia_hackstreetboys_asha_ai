import uuid
from datetime import datetime, date
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, Date, Enum, ForeignKey, Numeric, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY

from app.core.database import Base

if TYPE_CHECKING:
    from app.apps.users.models import User
    from app.apps.health_logs.models import HealthLog
    from app.apps.alerts.models import Alert
    from app.apps.children.models import Child
    from app.apps.enrollments.models import Enrollment


class BeneficiaryProfile(Base):
    """Beneficiary profile - contains health and personal data for beneficiaries"""
    __tablename__ = "beneficiary_profiles"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    user_type: Mapped[str] = mapped_column(
        Enum('girl', 'pregnant', 'mother', name='user_type'), 
        default='pregnant'
    )
    age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    height: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)  # in cm
    weight: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)  # in kg
    blood_group: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    last_period_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    pregnancy_stage: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # e.g., 'trimester_1'
    pregnancy_week: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    edd: Mapped[Optional[date]] = mapped_column(Date, nullable=True)  # Estimated Due Date
    anemia_status: Mapped[str] = mapped_column(
        Enum('normal', 'mild', 'moderate', 'severe', name='anemia_status'), 
        default='normal'
    )
    risk_level: Mapped[str] = mapped_column(
        Enum('low', 'medium', 'high', name='risk_level'), 
        default='low'
    )
    economic_status: Mapped[Optional[str]] = mapped_column(
        Enum('bpl', 'apl', name='economic_status'), 
        nullable=True
    )
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    gps_coords: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # { lat, lng }
    linked_asha_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    next_checkup_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    medical_history: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    current_medications: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    complications: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="beneficiary_profiles", foreign_keys=[user_id])
    linked_asha: Mapped[Optional["User"]] = relationship("User", foreign_keys=[linked_asha_id])
    health_logs: Mapped[List["HealthLog"]] = relationship("HealthLog", back_populates="beneficiary")
    alerts: Mapped[List["Alert"]] = relationship("Alert", back_populates="beneficiary")
    children: Mapped[List["Child"]] = relationship("Child", back_populates="beneficiary")
    enrollments: Mapped[List["Enrollment"]] = relationship("Enrollment", back_populates="beneficiary")
    
    def __repr__(self):
        return f"<BeneficiaryProfile {self.name}>"
