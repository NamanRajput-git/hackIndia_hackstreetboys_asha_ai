import json
import re
from typing import Optional, List, Dict, Any
from mistralai.client import Mistral
from app.core.config import get_settings
from app.apps.ai.schemas import (
    PromptRequest,
    AIResponse,
    MedicalDataExtraction,
    RiskAssessment
)

settings = get_settings()

# Emergency keywords in Hindi and English
EMERGENCY_KEYWORDS = [
    # Hindi
    'खून', 'bleeding', 'बहुत दर्द', 'तेज़ दर्द', 'severe pain',
    'behosh', 'बेहोश', 'unconscious', 'chakkar', 'चक्कर', 'dizzy',
    'bukhar', 'बुखार', 'fever', 'emergency', 'इमरजेंसी',
    'help', 'मदद', 'bachao', 'बचाओ', 'jaldi', 'जल्दी',
    'hospital', 'अस्पताल', 'doctor', 'डॉक्टर',
    # Danger signs
    'baby not moving', 'बच्चा नहीं हिल रहा', 'convulsion', 'दौरा',
    'water broke', 'पानी टूट गया', 'labour', 'प्रसव पीड़ा',
    'heavy bleeding', 'ज्यादा खून', "can't breathe", 'सांस नहीं आ रही'
]


def detect_emergency(message: str) -> bool:
    """Check if message contains emergency keywords"""
    lower_message = message.lower()
    return any(keyword.lower() in lower_message for keyword in EMERGENCY_KEYWORDS)


def detect_intent(message: str) -> str:
    """Detect intent from message"""
    lower_message = message.lower()
    
    if any(word in lower_message for word in ['period', 'mahina', 'माहवारी', 'mc', 'पीरियड']):
        return 'menstrual_query'
    if any(word in lower_message for word in ['pregnant', 'garbh', 'गर्भ', 'baby', 'बच्चा', 'पेट में']):
        return 'pregnancy_query'
    if any(word in lower_message for word in ['food', 'khana', 'खाना', 'diet', 'iron', 'आयरन', 'खाने']):
        return 'nutrition_query'
    if any(word in lower_message for word in ['sad', 'udas', 'उदास', 'tension', 'stress', 'थकान', 'नींद']):
        return 'mental_health_query'
    if any(word in lower_message for word in ['scheme', 'yojana', 'योजना', 'benefit', 'सरकार']):
        return 'scheme_query'
    if any(word in lower_message for word in ['ifa', 'tablet', 'goli', 'गोली', 'दवाई']):
        return 'ifa_query'
    
    return 'general_query'


def detect_category(intent: str) -> str:
    """Detect category from intent"""
    category_map = {
        'menstrual_query': 'menstrual_health',
        'pregnancy_query': 'pregnancy',
        'nutrition_query': 'nutrition',
        'mental_health_query': 'mental_health',
        'scheme_query': 'schemes',
        'ifa_query': 'nutrition',
        'general_query': 'general'
    }
    return category_map.get(intent, 'general')


class MistralService:
    """Service for interacting with Mistral AI API via official SDK"""
    
    def __init__(self):
        self.client = Mistral(api_key=settings.MISTRAL_API_KEY)
        self.model = settings.MISTRAL_MODEL
    
    async def generate(self, prompt: str) -> AIResponse:
        """Call the Mistral API to generate a response"""
        try:
            response = self.client.chat.complete(
                model=self.model,
                messages=[{"role": "user", "content": prompt}]
            )
            text = response.choices[0].message.content if response.choices else ""
            return AIResponse(
                response=text,
                success=True
            )
        except Exception as e:
            print(f"❌ Mistral API Error: {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc()
            return AIResponse(
                response="",
                success=False,
                error=f"Mistral API error: {str(e)}"
            )
    
    async def chat_with_asha_didi(
        self, 
        user_message: str, 
        conversation_history: List[Dict[str, str]] = None,
        language: str = 'hi'
    ) -> Dict[str, Any]:
        """
        Chat with ASHA Didi AI assistant.
        Returns structured response with message, emergency status, intent, and category.
        """
        is_emergency = detect_emergency(user_message)
        intent = detect_intent(user_message)
        category = detect_category(intent)
        
        # If emergency detected, return immediate response
        if is_emergency:
            emergency_response = (
                'यह गंभीर लग रहा है। कृपया तुरंत Red Zone बटन दबाएं या अपनी ASHA दीदी को बुलाएं। क्या आप ठीक हैं?'
                if language == 'hi' else
                'This sounds serious. Please press the Red Zone button immediately or call your ASHA worker. Are you okay?'
            )
            
            return {
                'message': emergency_response,
                'isEmergency': True,
                'intent': 'emergency',
                'category': 'emergency'
            }
        
        # Build system prompt based on language
        if language == 'hi':
            system_prompt = """आप "आशा दीदी" हैं, ग्रामीण भारतीय महिलाओं के लिए एक विश्वसनीय मातृ स्वास्थ्य साथी। आप एक देखभाल करने वाली बड़ी बहन की तरह हैं।

मूल व्यक्तित्व:
- गर्मजोशी भरा, मातृत्व भाव, बिना किसी निर्णय के
- बड़ी बहन या भरोसेमंद पड़ोसी की तरह बात करें
- सरल हिंदी का उपयोग करें जो गांव में सभी समझें
- सलाह देने से पहले भावनाओं को मान्य करें

जवाब के नियम:
1. जवाब 200 शब्दों से कम रखें
2. रोज़मर्रा की भाषा का उपयोग करें, मेडिकल शब्दों से बचें
3. आपातकालीन लक्षणों पर कहें: "यह गंभीर है। कृपया तुरंत Red Zone बटन दबाएं।"
4. कभी भी रोग निदान न करें - गंभीर लक्षणों के लिए हमेशा रेफर करें
5. आराम + कार्रवाई योग्य अगले कदम प्रदान करें
6. बातचीत जारी रखने के लिए प्रश्न से समाप्त करें

विषय: माहवारी, गर्भावस्था, पोषण (दाल, साग, चना, गुड़), IFA टैबलेट, मानसिक स्वास्थ्य, सरकारी योजनाएं, खतरे के संकेत

महत्वपूर्ण: केवल हिंदी में जवाब दें। अंग्रेज़ी शब्दों से बचें (सिर्फ "ASHA", "Red Zone" जैसे ज़रूरी शब्द छोड़कर)।"""
        else:
            system_prompt = """You are "Asha Didi", a trusted maternal health companion for rural Indian women. You are like a caring elder sister.

CORE PERSONALITY:
- Warm, motherly, non-judgmental tone
- Speaks like an elder sister or trusted neighbor
- Uses simple English that everyone can understand
- Validates feelings before giving advice

RESPONSE RULES:
1. Keep responses under 200 words
2. Use everyday language, avoid medical jargon
3. For emergency symptoms say: "This is serious. Please press the Red Zone button immediately."
4. Never diagnose - always refer for serious symptoms
5. Provide comfort + actionable next steps
6. End with a caring question to continue conversation

TOPICS: Period questions, pregnancy symptoms, nutrition (dal, saag, jaggery), IFA tablets, mental health, govt schemes, danger signs

CULTURAL CONTEXT: You understand rural Indian healthcare. Use familiar terms like "didi", "behan". Reference local foods."""

        # Build the full prompt with conversation history
        full_prompt = f"{system_prompt}\n\n"
        
        if conversation_history:
            for msg in conversation_history[-5:]:  # Include last 5 messages for context
                role = "उपयोगकर्ता" if msg['role'] == 'user' else "आशा दीदी"
                if language != 'hi':
                    role = "User" if msg['role'] == 'user' else "Asha Didi"
                full_prompt += f"{role}: {msg['content']}\n"
        
        if language == 'hi':
            full_prompt += f"\nउपयोगकर्ता: {user_message}\n\nआशा दीदी:"
        else:
            full_prompt += f"\nUser: {user_message}\n\nAsha Didi:"
        
        try:
            response = await self.generate(full_prompt)
            
            if response.success and response.response:
                ai_message = response.response.strip()
                # Clean up any prefixes the model might add
                ai_message = re.sub(r'^(आशा दीदी:|Asha Didi:)\s*', '', ai_message)
                
                return {
                    'message': ai_message,
                    'isEmergency': False,
                    'intent': intent,
                    'category': category
                }
            else:
                fallback = (
                    'माफ़ करें, अभी कुछ तकनीकी समस्या है। कृपया थोड़ी देर बाद कोशिश करें।'
                    if language == 'hi' else
                    'Sorry, there is a technical issue. Please try again later.'
                )
                return {
                    'message': fallback,
                    'isEmergency': False,
                    'intent': None,
                    'category': None
                }
                
        except Exception as e:
            print(f"Chat error: {e}")
            fallback = (
                'माफ़ करें, अभी कुछ तकनीकी समस्या है। कृपया थोड़ी देर बाद कोशिश करें।'
                if language == 'hi' else
                'Sorry, there is a technical issue. Please try again later.'
            )
            return {
                'message': fallback,
                'isEmergency': False,
                'intent': None,
                'category': None
            }
    
    async def extract_medical_data(self, transcript: str) -> MedicalDataExtraction:
        """Extract structured medical data from voice transcript using AI"""
        prompt = f"""
        Extract medical information from this health-related transcript.
        Return a JSON with these fields:
        - bp_systolic: systolic blood pressure if mentioned (number or null)
        - bp_diastolic: diastolic blood pressure if mentioned (number or null)
        - symptoms: array of symptoms mentioned
        - mood: detected mood (happy, neutral, sad, tired, anxious, pain)
        - is_emergency: true if this sounds like an emergency
        
        Transcript: "{transcript}"
        
        Respond ONLY with valid JSON.
        """
        
        response = await self.generate(prompt)
        
        if not response.success:
            return MedicalDataExtraction(raw_text=transcript)
        
        try:
            # Try to parse JSON from response
            data = json.loads(response.response)
            return MedicalDataExtraction(
                bp_systolic=data.get("bp_systolic"),
                bp_diastolic=data.get("bp_diastolic"),
                symptoms=data.get("symptoms", []),
                mood=data.get("mood"),
                is_emergency=data.get("is_emergency", False),
                raw_text=transcript
            )
        except:
            return MedicalDataExtraction(raw_text=transcript)
    
    async def assess_risk(self, data: MedicalDataExtraction) -> RiskAssessment:
        """Assess health risk based on extracted data"""
        risk_level = "low"
        should_sos = False
        guidance = "Aap theek hain. Aaram karein aur paani piyein."
        
        # Critical symptoms check
        critical_keywords = ["bleeding", "kharoon", "khoon", "seizure", "unconscious", "behosh", "severe pain", "bahut dard"]
        if any(kw in str(data.symptoms).lower() for kw in critical_keywords):
            risk_level = "critical"
            should_sos = True
            guidance = "Yeh gambhir lag raha hai. Turant ASHA didi ya hospital se sampark karein."
        
        # High risk BP check
        elif data.bp_systolic and data.bp_systolic >= 140:
            risk_level = "high"
            guidance = "Aapka blood pressure thoda zyada hai. ASHA didi se milein."
        
        elif data.bp_diastolic and data.bp_diastolic >= 90:
            risk_level = "high"
            guidance = "Aapka blood pressure thoda zyada hai. ASHA didi se milein."
        
        # Medium risk symptoms
        elif len(data.symptoms) >= 3:
            risk_level = "medium"
            guidance = "Kuch symptoms hain. Agar takleef badhe, ASHA didi ko batayein."
        
        return RiskAssessment(
            risk_level=risk_level,
            extracted_data=data,
            guidance=guidance,
            should_trigger_sos=should_sos
        )
    
    async def get_health_guidance(self, query: str, language: str = "hi") -> str:
        """Get health guidance for a query in the specified language"""
        
        if language == "hi":
            prompt = f"""आप ASHA AI हैं - ग्रामीण भारतीय महिलाओं की स्वास्थ्य सहेली।

नियम:
1. केवल हिंदी में जवाब दें
2. सरल और आसान शब्दों का प्रयोग करें
3. डॉक्टर की तरह निदान मत करें
4. यदि आपातकालीन स्थिति लगे तो तुरंत ASHA दीदी या अस्पताल जाने की सलाह दें
5. 2-3 छोटे वाक्यों में जवाब दें
6. सम्मानजनक और सहानुभूतिपूर्ण रहें

प्रश्न: "{query}"

कृपया हिंदी में उत्तर दें:"""
        else:
            prompt = f"""You are ASHA AI, a health companion for rural Indian women.

Rules:
1. Respond in simple English
2. Use easy-to-understand words
3. Never diagnose like a doctor
4. If emergency, strongly suggest ASHA worker or hospital visit
5. Keep response to 2-3 short sentences
6. Be respectful and empathetic

Query: "{query}"

Please respond in English:"""
        
        response = await self.generate(prompt)
        
        if response.success and response.response:
            return response.response
            
        print(f"⚠️ Health guidance generation failed: {response.error}")
        
        # Fallback messages
        if language == "hi":
            return f"माफ़ करें, अभी जवाब देने में समस्या है। त्रुटि: {response.error}"
        return f"Sorry, there was an issue getting a response. Error: {response.error}"
    
    async def extract_visit_data(self, transcription: str) -> Dict[str, Any]:
        """Extract structured visit data from ASHA worker's voice transcription"""
        prompt = f"""You are a medical data extraction AI. Extract structured JSON from this ASHA worker's visit notes.

RULES:
- Output ONLY valid JSON, no markdown, no explanations
- Use null for missing fields
- Detect patient name from context
- Extract vital signs, symptoms, and actions taken

VISIT NOTES: "{transcription}"

OUTPUT FORMAT:
{{
  "patient_name": string or null,
  "visit_type": "routine_checkup" | "emergency" | "follow_up" | null,
  "vitals": {{
    "blood_pressure": {{ "systolic": number, "diastolic": number }} or null,
    "weight_kg": number or null,
    "temperature_celsius": number or null
  }},
  "symptoms": string[],
  "symptom_severity": "mild" | "moderate" | "severe" | null,
  "services_provided": string[],
  "medicines_distributed": string[],
  "counseling_topics": string[],
  "observations": string or null,
  "concerns_noted": string or null,
  "follow_up_required": boolean,
  "next_visit_date": "YYYY-MM-DD" or null,
  "referral_needed": boolean,
  "referral_reason": string or null
}}"""

        try:
            response = await self.generate(prompt)
            
            if not response.success:
                return {}
            
            content = response.response
            
            # Remove markdown code blocks if present
            content = re.sub(r'```json\n?', '', content)
            content = re.sub(r'```\n?', '', content)
            content = content.strip()
            
            # Extract JSON object
            json_match = re.search(r'\{[\s\S]*\}', content)
            if json_match:
                try:
                    parsed = json.loads(json_match.group(0))
                    # Ensure all required fields have defaults
                    return {
                        "patient_name": parsed.get("patient_name"),
                        "visit_type": parsed.get("visit_type"),
                        "vitals": parsed.get("vitals", {
                            "blood_pressure": None,
                            "weight_kg": None,
                            "temperature_celsius": None
                        }),
                        "symptoms": parsed.get("symptoms", []),
                        "symptom_severity": parsed.get("symptom_severity"),
                        "services_provided": parsed.get("services_provided", []),
                        "medicines_distributed": parsed.get("medicines_distributed", []),
                        "counseling_topics": parsed.get("counseling_topics", []),
                        "observations": parsed.get("observations"),
                        "concerns_noted": parsed.get("concerns_noted"),
                        "follow_up_required": parsed.get("follow_up_required", False),
                        "next_visit_date": parsed.get("next_visit_date"),
                        "referral_needed": parsed.get("referral_needed", False),
                        "referral_reason": parsed.get("referral_reason")
                    }
                except json.JSONDecodeError as e:
                    print(f"JSON parse error: {e}")
                    return {}
            return {}
        except Exception as error:
            print(f"Data extraction error: {error}")
            return {}
    
    async def analyze_symptoms(
        self,
        symptoms: List[str],
        is_pregnant: bool,
        pregnancy_week: Optional[int] = None
    ) -> Dict[str, Any]:
        """Analyze symptoms for red flags"""
        context = (
            f"Patient is pregnant (week {pregnancy_week or 'unknown'})."
            if is_pregnant else
            "Patient is not currently pregnant."
        )

        prompt = f"""You are a maternal health risk assessment assistant. Analyze the following symptoms and determine if they indicate a red flag condition.

{context}

Red flag conditions include:
- Heavy vaginal bleeding
- Severe abdominal pain
- High fever (>38°C)
- Severe headache with vision problems
- Seizures or convulsions
- Decreased or no fetal movement (after 20 weeks)
- Water breaking before 37 weeks
- Signs of preeclampsia (swelling, headache, vision changes)

Symptoms: {', '.join(symptoms)}

Return a JSON object with:
- isRedFlag: boolean
- riskScore: number (0-100)
- recommendation: string (in simple language)
- reasons: array of strings explaining the assessment"""

        try:
            response = await self.generate(prompt)
            
            if not response.success:
                return {
                    "isRedFlag": False,
                    "riskScore": 0,
                    "recommendation": "Unable to assess. Please consult your ASHA worker.",
                    "reasons": []
                }
            
            content = response.response
            json_match = re.search(r'\{[\s\S]*\}', content)
            
            if json_match:
                return json.loads(json_match.group(0))
            
            return {
                "isRedFlag": False,
                "riskScore": 0,
                "recommendation": "Unable to assess. Please consult your ASHA worker.",
                "reasons": []
            }
        except Exception as error:
            print(f"Symptom analysis error: {error}")
            return {
                "isRedFlag": False,
                "riskScore": 0,
                "recommendation": "Unable to assess. Please consult your ASHA worker.",
                "reasons": []
            }
    
    async def generate_nutrition_plan(
        self, 
        user_type: str,
        age: Optional[int] = None,
        anemia_status: Optional[str] = None,
        pregnancy_week: Optional[int] = None
    ) -> dict:
        """Generate a personalized nutrition plan"""
        context = f"User type: {user_type}"
        if age:
            context += f", Age: {age}"
        if anemia_status:
            context += f", Anemia: {anemia_status}"
        if pregnancy_week:
            context += f", Pregnancy week: {pregnancy_week}"
        
        prompt = f"""
        Create a simple nutrition plan for a rural Indian woman.
        Context: {context}
        
        Focus on:
        - Iron-rich foods (especially if anemic)
        - Affordable, locally available foods
        - Simple preparation methods
        
        Return a JSON with:
        - recommendations: array of 3-4 short tips
        - iron_rich_foods: array of iron-rich food names
        - meals: array of 3 meal suggestions with name and description
        
        Respond ONLY with valid JSON.
        """
        
        response = await self.generate(prompt)
        
        if response.success:
            try:
                return json.loads(response.response)
            except:
                pass
        
        # Default plan if AI fails
        return {
            "recommendations": [
                "Har din hara saag khayein",
                "Gur aur chana milakr khayein",
                "Nimbu paani piyein (iron absorb karne mein madad)"
            ],
            "iron_rich_foods": ["Palak", "Chana", "Gur", "Chaulai", "Methi"],
            "meals": [
                {"name": "Nashta", "description": "Gur ki roti, doodh"},
                {"name": "Dopahar", "description": "Dal, chawal, aur palak sabzi"},
                {"name": "Raat", "description": "Roti, chane ki sabzi, aur salad"}
            ]
        }


# Singleton instance
mistral_service = MistralService()
