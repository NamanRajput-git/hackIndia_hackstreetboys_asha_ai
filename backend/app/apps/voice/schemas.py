"""
Pydantic schemas for voice processing
"""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class TranscriptionResponse(BaseModel):
    """Response from Whisper transcription"""
    transcript: str
    language: str = 'hi'
    confidence: Optional[float] = None


class ChatLogRequest(BaseModel):
    """Request to log a chat interaction"""
    user_message: str
    ai_response: str
    language_used: str = 'hi'
    is_emergency: bool = False
    beneficiary_id: Optional[uuid.UUID] = None
    intent: Optional[str] = None
    category: Optional[str] = None
    audio_duration_seconds: Optional[int] = None
    transcription_confidence: Optional[float] = None


class ChatLogResponse(BaseModel):
    """Response after logging chat"""
    id: uuid.UUID
    user_message: str
    ai_response: str
    language_used: str
    is_emergency: bool
    created_at: datetime


class ChatHistoryItem(BaseModel):
    """Single item from chat history"""
    id: uuid.UUID
    user_message: str
    ai_response: str
    language_used: str
    is_emergency: bool
    intent: Optional[str]
    category: Optional[str]
    created_at: datetime


class ChatHistoryResponse(BaseModel):
    """Response with chat history"""
    items: list[ChatHistoryItem]
    total: int
