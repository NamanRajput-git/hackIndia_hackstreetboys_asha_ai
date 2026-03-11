# AI app module - integrates with Gemini API
from app.apps.ai.schemas import (
    PromptRequest,
    AIResponse,
    VoiceTranscript,
    MedicalDataExtraction,
    RiskAssessment
)

__all__ = [
    "PromptRequest",
    "AIResponse", 
    "VoiceTranscript",
    "MedicalDataExtraction",
    "RiskAssessment"
]
