from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.apps.users.models import User
from app.apps.ai.schemas import (
    PromptRequest,
    AIResponse,
    VoiceTranscript,
    RiskAssessment,
    HealthQueryRequest,
    NutritionPlanRequest,
    NutritionPlanResponse
)
from app.apps.ai.service import gemini_service

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/generate", response_model=AIResponse)
async def generate_response(
    request: PromptRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate AI response using Gemini API"""
    return await gemini_service.generate(request.text)


@router.post("/analyze-voice", response_model=RiskAssessment)
async def analyze_voice_transcript(
    request: VoiceTranscript,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Analyze voice transcript and extract medical data with risk assessment"""
    # Extract medical data
    extracted = await gemini_service.extract_medical_data(request.transcript)
    
    # Assess risk
    risk_assessment = await gemini_service.assess_risk(extracted)
    
    # If critical risk and beneficiary_id provided, we could auto-trigger SOS
    # (This would be handled by the frontend based on should_trigger_sos)
    
    return risk_assessment


@router.post("/health-query")
async def get_health_guidance(
    request: HealthQueryRequest,
    current_user: User = Depends(get_current_user)
):
    """Get AI health guidance for a query"""
    guidance = await gemini_service.get_health_guidance(
        request.query, 
        request.language
    )
    return {"guidance": guidance}


@router.post("/nutrition-plan", response_model=NutritionPlanResponse)
async def generate_nutrition_plan(
    request: NutritionPlanRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate personalized nutrition plan"""
    plan = await gemini_service.generate_nutrition_plan(
        user_type=request.user_type,
        age=request.age,
        anemia_status=request.anemia_status,
        pregnancy_week=request.pregnancy_week
    )
    
    return NutritionPlanResponse(
        plan=plan,
        recommendations=plan.get("recommendations", []),
        iron_rich_foods=plan.get("iron_rich_foods", []),
        meals=plan.get("meals", [])
    )


@router.post("/extract-visit-data")
async def extract_visit_data(
    request: PromptRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Extract structured visit data from ASHA worker's voice transcription.
    
    IMPORTANT: This is a healthcare application. The returned data MUST be
    verified by the ASHA worker before saving to the database.
    """
    try:
        # Use the improved extraction method from the service
        result = await gemini_service.extract_visit_data(request.text)
        
        if not result:
            # Return empty structure if extraction failed
            return {
                "patient_name": None,
                "visit_type": None,
                "vitals": {},
                "symptoms": [],
                "services_provided": [],
                "observations": request.text,
                "follow_up_required": False,
                "referral_needed": False,
                "requires_verification": True,
                "extraction_note": "Automatic extraction failed. Please enter data manually."
            }
        
        # Add verification flag - CRITICAL for healthcare safety
        result["requires_verification"] = True
        result["extraction_note"] = "Please verify all extracted data before saving."
        
        return result
        
    except Exception as e:
        # Return safe fallback with the original text
        return {
            "patient_name": None,
            "visit_type": None,
            "vitals": {},
            "symptoms": [],
            "services_provided": [],
            "observations": request.text,
            "follow_up_required": False,
            "referral_needed": False,
            "requires_verification": True,
            "extraction_note": f"Error during extraction: {str(e)}. Please enter data manually.",
            "error": str(e)
        }


@router.get("/health")
async def health_check():
    """Check if AI service is healthy"""
    try:
        # Try a simple call to check connectivity
        response = await gemini_service.generate("Hello")
        return {
            "status": "healthy" if response.success else "degraded",
            "gemini_api": response.success
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

