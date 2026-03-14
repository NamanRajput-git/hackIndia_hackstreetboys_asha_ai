"""
Voice API Router - Whisper STT and Voice Processing

This module provides endpoints for:
1. /transcribe - Audio transcription using OpenAI Whisper
2. /chat - AI chat with ASHA Didi
3. /process - Combined voice processing (transcribe + extract data)
4. /log - Log voice interactions
5. /history - Get chat history
"""

import json
import tempfile
import subprocess
import os
from datetime import datetime
from typing import Optional, List
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel

from app.core.database import get_db
from app.core.config import get_settings
from app.core.security import get_current_user, get_current_user_optional
from app.apps.users.models import User
from app.apps.ai.service import mistral_service

router = APIRouter(prefix="/voice", tags=["Voice"])

# ============================================================================
# Whisper Model Management
# ============================================================================

# Global Whisper model cache
_whisper_model = None
settings = get_settings()


def get_whisper_model():
    """Get or load the cached Whisper model. Thread-safe via GIL."""
    global _whisper_model

    if _whisper_model is None:
        try:
            import whisper
            model_name = settings.WHISPER_MODEL
            device = settings.WHISPER_DEVICE  # 'cpu' or 'cuda'
            print(f"[Whisper] Loading model '{model_name}' on device '{device}'...")
            _whisper_model = whisper.load_model(model_name, device=device)
            print(f"[Whisper] ✅ Model loaded successfully (model={model_name}, device={device})")
        except ImportError:
            raise HTTPException(
                status_code=503,
                detail="Whisper not installed. Run: pip install openai-whisper"
            )
        except Exception as e:
            raise HTTPException(
                status_code=503,
                detail=f"Failed to load Whisper model: {str(e)}"
            )

    return _whisper_model


def _get_ffmpeg_binary() -> str:
    """Return path to ffmpeg binary — system PATH first, then imageio-ffmpeg fallback."""
    # Try system ffmpeg first
    import shutil
    sys_ffmpeg = shutil.which("ffmpeg")
    if sys_ffmpeg:
        return sys_ffmpeg
    # Fallback: bundled ffmpeg via imageio-ffmpeg (works on Windows without install)
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        pass
    return "ffmpeg"  # will fail, but give a meaningful error


def convert_audio_to_wav(input_path: str, output_path: str) -> bool:
    """Convert audio file to WAV 16kHz mono using FFmpeg (system or bundled)."""
    try:
        ffmpeg_bin = _get_ffmpeg_binary()
        cmd = [
            ffmpeg_bin, "-y",
            "-i", input_path,
            "-ar", "16000",      # 16kHz sample rate (Whisper requirement)
            "-ac", "1",          # Mono channel
            "-c:a", "pcm_s16le", # 16-bit PCM
            output_path
        ]
        result = subprocess.run(cmd, capture_output=True, timeout=30)
        if result.returncode != 0:
            print(f"[FFmpeg] Conversion failed: {result.stderr.decode(errors='replace')[:200]}")
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        print("[FFmpeg] Conversion timed out")
        return False
    except FileNotFoundError:
        print("[FFmpeg] FFmpeg not found. Install: winget install ffmpeg  OR  pip install imageio-ffmpeg")
        return False
    except Exception as e:
        print(f"[FFmpeg] Error: {e}")
        return False


# ============================================================================
# Request/Response Models
# ============================================================================

class TranscriptionResponse(BaseModel):
    transcript: str
    language: str
    confidence: float = 0.0
    duration: float = 0.0


class ChatRequest(BaseModel):
    message: str
    conversation_history: List[dict] = []
    language: str = "hi"
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    message: str
    isEmergency: bool = False
    intent: Optional[str] = None
    category: Optional[str] = None


class ChatLogRequest(BaseModel):
    user_message: str
    ai_response: str
    language_used: str = "hi"
    is_emergency: bool = False
    beneficiary_id: Optional[str] = None
    intent: Optional[str] = None
    category: Optional[str] = None


class ChatLogResponse(BaseModel):
    id: str
    logged_at: str


# ============================================================================
# Transcription Endpoint
# ============================================================================

@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    audio: UploadFile = File(..., description="Audio file to transcribe"),
    language: Optional[str] = Form(None, description="Language code (hi, en, etc.)"),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Transcribe audio using OpenAI Whisper.
    
    Supports: webm, mp4, wav, ogg, mp3, m4a, flac
    Max file size: 25MB
    """
    print(f"[Transcribe] Received file: {audio.filename}, size: {audio.size}, type: {audio.content_type}")
    
    # Validate file type (lenient validation)
    allowed_types = ['audio/', 'video/', 'application/octet-stream']
    content_type = audio.content_type or 'application/octet-stream'
    if not any(content_type.startswith(t) for t in allowed_types):
        print(f"[Transcribe] Warning: Unusual content type {content_type}, proceeding anyway")
    
    # Read file
    try:
        audio_data = await audio.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read audio file: {str(e)}")
    
    if len(audio_data) == 0:
        raise HTTPException(status_code=400, detail="Audio file is empty")
    
    if len(audio_data) > 25 * 1024 * 1024:  # 25MB max
        raise HTTPException(status_code=400, detail="Audio file too large (max 25MB)")
    
    print(f"[Transcribe] Audio data size: {len(audio_data)} bytes")
    
    # Determine file extension
    filename = audio.filename or 'audio.webm'
    ext = Path(filename).suffix.lower() or '.webm'
    if ext not in ['.webm', '.mp4', '.wav', '.ogg', '.mp3', '.m4a', '.flac']:
        ext = '.webm'  # Default to webm
    
    temp_input = None
    temp_wav = None
    
    try:
        # Get Whisper model
        model = get_whisper_model()
        
        # Save audio to temp file
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as f:
            f.write(audio_data)
            temp_input = f.name
        
        print(f"[Transcribe] Saved temp file: {temp_input}")
        
        # Convert to WAV for better compatibility
        temp_wav = temp_input.replace(ext, '.wav')
        if ext != '.wav':
            print("[Transcribe] Converting to WAV...")
            # Run in threadpool to avoid blocking event loop
            is_converted = await run_in_threadpool(convert_audio_to_wav, temp_input, temp_wav)
            if is_converted:
                print("[Transcribe] Conversion successful")
                transcribe_path = temp_wav
            else:
                print("[Transcribe] Conversion failed, using original file")
                transcribe_path = temp_input
        else:
            transcribe_path = temp_input
        
        # Prepare transcription options
        options = {
            "fp16": False,  # Use FP32 for better compatibility
        }
        
        # Set language if provided
        if language:
            # Comprehensive map: BCP-47 / short codes → Whisper language names
            lang_map = {
                # Hindi
                'hi': 'Hindi', 'hi-IN': 'Hindi', 'hindi': 'Hindi',
                # English
                'en': 'English', 'en-US': 'English', 'en-IN': 'English', 'english': 'English',
                # Regional Indian languages (from project spec)
                'gu': 'Gujarati', 'gu-IN': 'Gujarati',
                'kn': 'Kannada',  'kn-IN': 'Kannada',
                'ta': 'Tamil',    'ta-IN': 'Tamil',
                'te': 'Telugu',   'te-IN': 'Telugu',
                'ml': 'Malayalam','ml-IN': 'Malayalam',
                'mr': 'Marathi',  'mr-IN': 'Marathi',
                'bn': 'Bengali',  'bn-IN': 'Bengali',
                'pa': 'Punjabi',  'pa-IN': 'Punjabi',
                # Bhojpuri — Whisper uses Hindi as closest model
                'bh': 'Hindi',    'bho': 'Hindi',
                # Urdu
                'ur': 'Urdu',     'ur-IN': 'Urdu',
            }
            options['language'] = lang_map.get(language.lower(), language)
            print(f"[Transcribe] Language '{language}' → Whisper language '{options['language']}'")
        
        # Transcribe
        print("[Transcribe] Starting transcription...")
        # Run in threadpool to avoid blocking event loop
        result = await run_in_threadpool(model.transcribe, transcribe_path, **options)
        
        transcript = result.get("text", "").strip()
        detected_language = result.get("language", language or "unknown")
        
        print(f"[Transcribe] Result: {transcript[:100]}..." if len(transcript) > 100 else f"[Transcribe] Result: {transcript}")
        
        if not transcript:
            raise HTTPException(
                status_code=400,
                detail="No speech detected. Please speak clearly and try again."
            )
        
        # Calculate approximate duration from segments if available
        duration = 0.0
        if result.get("segments"):
            duration = result["segments"][-1].get("end", 0.0)
        
        return TranscriptionResponse(
            transcript=transcript,
            language=detected_language,
            confidence=0.9,  # Whisper doesn't provide confidence scores
            duration=duration
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Transcribe] Error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Transcription failed: {str(e)}"
        )
    finally:
        # Cleanup temp files
        for temp_file in [temp_input, temp_wav]:
            if temp_file and os.path.exists(temp_file):
                try:
                    os.unlink(temp_file)
                except Exception as e:
                    print(f"[Transcribe] Failed to cleanup {temp_file}: {e}")



# ============================================================================
# Whisper Health Status Endpoint
# ============================================================================

@router.get("/whisper-status")
async def whisper_status():
    """
    Check if Whisper model is loaded and ready.
    Call this after startup to verify local Whisper is working.
    """
    global _whisper_model
    loaded = _whisper_model is not None
    return {
        "loaded": loaded,
        "model": settings.WHISPER_MODEL,
        "device": settings.WHISPER_DEVICE,
        "preload_enabled": settings.WHISPER_PRELOAD,
        "status": "ready" if loaded else "not_loaded",
        "message": (
            f"Whisper '{settings.WHISPER_MODEL}' model is loaded on '{settings.WHISPER_DEVICE}' and ready for transcription."
            if loaded else
            "Whisper model not yet loaded. It will load on the first /transcribe request."
        )
    }


# ============================================================================
# Chat Endpoint
# ============================================================================

@router.post("/chat", response_model=ChatResponse)
async def chat_with_asha_didi(
    request: ChatRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Chat with ASHA Didi AI assistant.
    Supports both Hindi and English.
    Automatically detects emergencies and provides appropriate responses.
    """
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    # Normalize language
    lang = request.language.lower().strip()
    if lang in ['hindi', 'hi-in']:
        lang = 'hi'
    elif lang in ['english', 'en-us']:
        lang = 'en'
    request.language = lang
    
    print(f"[Chat] Message: {request.message[:50]}... Language: {request.language}")
    
    try:
        # Get AI response
        result = await mistral_service.chat_with_asha_didi(
            user_message=request.message,
            conversation_history=request.conversation_history,
            language=request.language
        )
        
        return ChatResponse(
            message=result.get("message", ""),
            isEmergency=result.get("isEmergency", False),
            intent=result.get("intent"),
            category=result.get("category")
        )
        
    except Exception as e:
        print(f"[Chat] Error: {e}")
        fallback = (
            "माफ़ करें, अभी कुछ तकनीकी समस्या है। कृपया थोड़ी देर बाद कोशिश करें।"
            if request.language == "hi" else
            "Sorry, there is a technical issue. Please try again later."
        )
        return ChatResponse(
            message=fallback,
            isEmergency=False,
            intent=None,
            category=None
        )


# ============================================================================
# Voice Processing Endpoint (Transcribe + Extract Data)
# ============================================================================

@router.post("/process")
async def process_voice(
    audio: Optional[UploadFile] = File(None, description="Audio file to process"),
    transcription: Optional[str] = Form(None, description="Pre-transcribed text"),
    language: str = Form("hi", description="Language code"),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Process voice recording:
    - Option A: Upload audio file → transcribe → extract data
    - Option B: Submit transcription → extract data
    """
    result_transcription = transcription
    
    # If audio file provided, transcribe it first
    if audio and audio.filename:
        print(f"[Process] Transcribing audio file: {audio.filename}")
        transcribe_response = await transcribe_audio(audio, language, current_user)
        result_transcription = transcribe_response.transcript
    
    if not result_transcription or not result_transcription.strip():
        raise HTTPException(status_code=400, detail="No transcription provided or detected")
    
    print(f"[Process] Extracting data from: {result_transcription[:100]}...")
    
    # Extract structured data
    try:
        extracted_data = await mistral_service.extract_visit_data(result_transcription)
    except Exception as e:
        print(f"[Process] Extraction error: {e}")
        extracted_data = {}
    
    # Detect missing fields for follow-up
    missing_fields = []
    
    if not extracted_data.get("patient_name"):
        missing_fields.append("patient_name")
    
    vitals = extracted_data.get("vitals", {})
    if not vitals or (not vitals.get("blood_pressure") and not vitals.get("weight_kg") and not vitals.get("temperature_celsius")):
        missing_fields.append("vitals")
    
    if not extracted_data.get("visit_type"):
        missing_fields.append("visit_type")
    
    # Generate follow-up question in Hindi if data incomplete
    follow_up_question = None
    if missing_fields:
        field_questions = {
            "patient_name": "कृपया मरीज़ का नाम बताएं।",
            "vitals": "कृपया BP, वज़न या तापमान बताएं।",
            "visit_type": "यह कौन सी विज़िट है - routine checkup, follow up, या emergency?",
        }
        follow_up_question = field_questions.get(missing_fields[0])
    
    # Calculate confidence score
    total_fields = 10
    filled_fields = sum([
        bool(extracted_data.get("patient_name")),
        bool(extracted_data.get("visit_type")),
        bool(vitals.get("blood_pressure")) if vitals else False,
        bool(vitals.get("weight_kg")) if vitals else False,
        bool(vitals.get("temperature_celsius")) if vitals else False,
        bool(extracted_data.get("symptoms")),
        bool(extracted_data.get("services_provided")),
        bool(extracted_data.get("observations")),
        extracted_data.get("follow_up_required") is not None,
        extracted_data.get("referral_needed") is not None,
    ])
    
    confidence_score = round(filled_fields / total_fields, 2)
    
    return {
        "success": True,
        "transcription": result_transcription,
        "extractedData": extracted_data,
        "confidenceScore": confidence_score,
        "missingFields": missing_fields,
        "followUpQuestion": follow_up_question,
        "isComplete": len(missing_fields) == 0,
    }


# ============================================================================
# Chat Logging Endpoint
# ============================================================================

@router.post("/log", response_model=ChatLogResponse, status_code=status.HTTP_201_CREATED)
async def log_chat_interaction(
    data: ChatLogRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Log a voice/chat interaction.
    Stores the interaction for history and analytics.
    """
    from app.apps.voice.models import ChatLog
    
    # Normalize language
    lang = data.language_used.lower().strip()
    if lang in ['hindi', 'hi-in']:
        data.language_used = 'hi'
    elif lang in ['english', 'en-us']:
        data.language_used = 'en'

    try:
        chat_log = ChatLog(
            user_id=current_user.id if current_user else None,
            beneficiary_id=data.beneficiary_id,
            user_message=data.user_message,
            ai_response=data.ai_response,
            language_used=data.language_used,
            is_emergency=data.is_emergency,
            intent=data.intent,
            category=data.category,
        )
        
        db.add(chat_log)
        await db.commit()
        await db.refresh(chat_log)
        
        return ChatLogResponse(
            id=str(chat_log.id),
            logged_at=chat_log.created_at.isoformat()
        )
        
    except Exception as e:
        print(f"[Log] Error: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to log interaction")


# ============================================================================
# Chat History Endpoint
# ============================================================================

@router.get("/history")
async def get_chat_history(
    limit: int = 20,
    beneficiary_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get chat history for the current user.
    ASHA workers can filter by beneficiary_id.
    """
    from app.apps.voice.models import ChatLog
    
    try:
        query = select(ChatLog).order_by(desc(ChatLog.created_at)).limit(limit)
        
        # Filter based on user role
        if current_user.role == "asha":
            # ASHA workers see chats they logged or their beneficiaries' chats
            if beneficiary_id:
                query = query.where(ChatLog.beneficiary_id == beneficiary_id)
            else:
                query = query.where(ChatLog.user_id == current_user.id)
        else:
            # Beneficiaries only see their own chats
            query = query.where(ChatLog.beneficiary_id == str(current_user.id))
        
        result = await db.execute(query)
        logs = result.scalars().all()
        
        return [
            {
                "id": str(log.id),
                "user_message": log.user_message,
                "ai_response": log.ai_response,
                "language": log.language_used,
                "is_emergency": log.is_emergency,
                "intent": log.intent,
                "category": log.category,
                "created_at": log.created_at.isoformat(),
            }
            for log in logs
        ]
        
    except Exception as e:
        print(f"[History] Error: {e}")
        return []


# ============================================================================
# Emergency Count Endpoint
# ============================================================================

@router.get("/emergency-count")
async def get_emergency_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get count of emergency interactions for ASHA worker's dashboard.
    """
    from app.apps.voice.models import ChatLog
    from sqlalchemy import func
    
    if current_user.role != "asha":
        raise HTTPException(status_code=403, detail="Only ASHA workers can access this endpoint")
    
    try:
        query = select(func.count(ChatLog.id)).where(
            ChatLog.user_id == current_user.id,
            ChatLog.is_emergency == True
        )
        result = await db.execute(query)
        count = result.scalar() or 0
        
        return {"emergency_count": count}
        
    except Exception as e:
        print(f"[EmergencyCount] Error: {e}")
        return {"emergency_count": 0}
