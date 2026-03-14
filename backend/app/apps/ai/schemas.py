from typing import Optional, List, Literal
from pydantic import BaseModel


class PromptRequest(BaseModel):
    """Request schema for Mistral AI"""
    text: str


class AIResponse(BaseModel):
    """Response from AI service"""
    response: str
    success: bool = True
    error: Optional[str] = None


class VoiceTranscript(BaseModel):
    """Voice transcript input"""
    transcript: str
    beneficiary_id: Optional[str] = None
    language: str = "hi"


class MedicalDataExtraction(BaseModel):
    """Extracted medical data from voice/text"""
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    symptoms: List[str] = []
    mood: Optional[str] = None
    is_emergency: bool = False
    raw_text: Optional[str] = None


class RiskAssessment(BaseModel):
    """Risk assessment result"""
    risk_level: Literal['low', 'medium', 'high', 'critical']
    extracted_data: MedicalDataExtraction
    guidance: str
    should_trigger_sos: bool = False


class HealthQueryRequest(BaseModel):
    """Health query request for AI guidance"""
    query: str
    language: str = "hi"
    context: Optional[dict] = None


class NutritionPlanRequest(BaseModel):
    """Nutrition plan request"""
    user_type: Literal['girl', 'pregnant', 'mother']
    age: Optional[int] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    anemia_status: Optional[str] = None
    pregnancy_week: Optional[int] = None
    language: str = "hi"


class NutritionPlanResponse(BaseModel):
    """Nutrition plan response"""
    plan: dict
    recommendations: List[str] = []
    iron_rich_foods: List[str] = []
    meals: List[dict] = []
