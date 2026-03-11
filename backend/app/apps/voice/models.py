"""
Voice interaction models for ASHA AI
Stores chat history between users and AI assistant
"""
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class ChatLog(Base):
    
    """
    Chat Log - records all voice/text interactions with AI
    Also known as AIChatHistory for backwards compatibility
    """

    __tablename__ = "ai_chat_history"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # User information
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="SET NULL"), 
        nullable=True
    )
    beneficiary_id: Mapped[Optional[str]] = mapped_column(
        String(255),  # Allow string IDs as well as UUIDs
        nullable=True
    )
    
    # Chat content
    user_message: Mapped[str] = mapped_column(Text, nullable=False)
    ai_response: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Metadata
    language_used: Mapped[str] = mapped_column(String(10), default='hi')
    is_emergency: Mapped[bool] = mapped_column(Boolean, default=False)
    intent: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Voice-specific metadata
    audio_duration_seconds: Mapped[Optional[int]] = mapped_column(nullable=True)
    transcription_confidence: Mapped[Optional[float]] = mapped_column(nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    
    def __repr__(self):
        return f"<ChatLog {self.id}>"


# Backwards compatibility alias
AIChatHistory = ChatLog
