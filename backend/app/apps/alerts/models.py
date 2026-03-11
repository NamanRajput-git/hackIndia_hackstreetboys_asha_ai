import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base

if TYPE_CHECKING:
    from app.apps.beneficiaries.models import BeneficiaryProfile
    from app.apps.users.models import User


class Alert(Base):
    """Alerts - SOS and health risk alerts"""
    __tablename__ = "alerts"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    beneficiary_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("beneficiary_profiles.id", ondelete="CASCADE"), 
        nullable=False
    )
    type: Mapped[str] = mapped_column(
        Enum('sos', 'health_risk', name='alert_type'), 
        nullable=False
    )
    severity: Mapped[str] = mapped_column(
        Enum('medium', 'high', 'critical', name='alert_severity'), 
        nullable=False
    )
    status: Mapped[str] = mapped_column(
        Enum('open', 'resolved', name='alert_status'), 
        default='open'
    )
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    triggered_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id"), 
        nullable=True
    )
    resolved_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id"), 
        nullable=True
    )
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    beneficiary: Mapped["BeneficiaryProfile"] = relationship("BeneficiaryProfile", back_populates="alerts")
    trigger_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[triggered_by])
    resolver_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[resolved_by])
    
    def __repr__(self):
        return f"<Alert {self.type}/{self.severity} for {self.beneficiary_id}>"
