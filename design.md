# 🏗️ ASHA AI - System Design Document

## 📐 Architecture Overview

ASHA AI follows a modern, scalable three-tier architecture optimized for rural healthcare delivery with offline-first capabilities.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   React PWA  │  │ Voice Input  │  │ Offline DB   │       │
│  │   (Vite)     │  │ (Web Speech) │  │ (IndexedDB)  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS/REST
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   FastAPI    │  │  JWT Auth    │  │  CORS/Rate   │       │
│  │   Routers    │  │  Middleware  │  │   Limiting   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            ↕ SQLAlchemy ORM
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  PostgreSQL  │  │  Alembic     │  │   Gemini AI  │       │
│  │  (Neon DB)   │  │  Migrations  │  │   (External) │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Frontend Architecture

### Technology Stack

- **React 19.1**: Component-based UI with hooks
- **TypeScript 5.8**: Type-safe development
- **Vite 6.3**: Fast build tool with HMR
- **Zustand 5.0**: Lightweight state management
- **React Router 7.11**: Client-side routing
- **Tailwind CSS 3.4**: Utility-first styling
- **Framer Motion 12**: Smooth animations
- **Axios 1.9**: HTTP client with interceptors

### Component Architecture

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── GlassCard.tsx
│   │   ├── VoiceInput.tsx
│   │   ├── LanguageToggle.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── NetworkStatus.tsx
│   ├── beneficiary/     # Beneficiary-specific components
│   │   ├── CalendarWidget.tsx
│   │   ├── DigitalHealthCard.tsx
│   │   ├── HealthCharts.tsx
│   │   └── VaccinationTracker.tsx
│   ├── partner/         # Partner dashboard components
│   │   ├── CampaignBuilder.tsx
│   │   └── PhonePreview.tsx
│   └── layout/          # Layout components
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
├── pages/               # Route-level pages
│   ├── Landing.tsx
│   ├── auth/
│   ├── beneficiary/
│   ├── asha/
│   └── partner/
├── store/               # Zustand state management
│   ├── useStore.ts      # Main app store
│   └── useToast.ts      # Toast notifications
├── services/            # API service layer
│   ├── api.ts           # Axios instance
│   ├── auth.service.ts
│   ├── beneficiary.service.ts
│   └── ai.service.ts
├── hooks/               # Custom React hooks
│   ├── useVoiceInput.ts
│   ├── useOfflineSync.ts
│   └── useAuth.ts
└── utils/               # Utility functions
    ├── dateHelpers.ts
    ├── voiceHelpers.ts
    └── validators.ts
```


### Offline-First Strategy

1. **Service Worker**: Cache static assets and API responses
2. **IndexedDB**: Store health data, chat history, and user preferences
3. **Sync Queue**: Queue failed requests for background sync
4. **Optimistic Updates**: Update UI immediately, sync in background
5. **Conflict Resolution**: Timestamp-based last-write-wins


---

## 🔧 Backend Architecture

### Technology Stack

- **FastAPI 0.109**: Modern async Python web framework
- **SQLAlchemy 2.0**: Async ORM with type hints
- **Alembic 1.13**: Database migration tool
- **PostgreSQL 14+**: Primary database (Neon DB)
- **asyncpg**: High-performance async PostgreSQL driver
- **python-jose**: JWT token handling
- **bcrypt**: Password hashing
- **Pydantic 2.5**: Data validation and serialization

### Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI application entry
│   ├── core/
│   │   ├── config.py           # Settings management
│   │   ├── database.py         # DB connection & session
│   │   └── security.py         # JWT & password utils
│   ├── apps/
│   │   ├── users/              # Authentication & users
│   │   │   ├── models.py
│   │   │   ├── router.py
│   │   │   └── schemas.py
│   │   ├── beneficiaries/      # Beneficiary management
│   │   ├── daily_logs/         # Daily health logs
│   │   ├── health_logs/        # Detailed health records
│   │   ├── alerts/             # Alert system
│   │   ├── children/           # Child health tracking
│   │   ├── schemes/            # Government schemes
│   │   ├── enrollments/        # Scheme enrollments
│   │   ├── visits/             # ASHA worker visits
│   │   ├── ai/                 # AI chat & analysis
│   │   │   ├── router.py
│   │   │   ├── service.py      # Gemini integration
│   │   │   └── schemas.py
│   │   └── voice/              # Voice processing
│   └── __init__.py
├── alembic/
│   ├── versions/               # Migration files
│   └── env.py
├── alembic.ini
├── requirements.txt
└── .env
```


### API Design Patterns

#### RESTful Endpoints

```
/api/v1/
├── auth/
│   ├── POST   /register          # User registration
│   ├── POST   /login             # User login
│   ├── POST   /refresh           # Refresh JWT token
│   └── GET    /me                # Current user info
├── beneficiaries/
│   ├── GET    /                  # List beneficiaries
│   ├── POST   /                  # Create beneficiary
│   ├── GET    /{id}              # Get beneficiary details
│   ├── PUT    /{id}              # Update beneficiary
│   └── DELETE /{id}              # Delete beneficiary
├── daily-logs/
│   ├── GET    /                  # List daily logs
│   ├── POST   /                  # Create daily log
│   └── GET    /beneficiary/{id}  # Logs for beneficiary
├── health-logs/
│   ├── GET    /                  # List health logs
│   ├── POST   /                  # Create health log
│   └── GET    /beneficiary/{id}  # Health logs for beneficiary
├── alerts/
│   ├── GET    /                  # List alerts
│   ├── POST   /                  # Create alert
│   ├── PUT    /{id}/acknowledge  # Acknowledge alert
│   └── GET    /unread-count      # Count unread alerts
├── visits/
│   ├── GET    /                  # List visits
│   ├── POST   /                  # Create visit
│   ├── GET    /{id}              # Get visit details
│   └── PUT    /{id}              # Update visit
├── ai/
│   ├── POST   /chat              # Chat with ASHA Didi AI
│   ├── POST   /extract-medical   # Extract medical data
│   ├── POST   /assess-risk       # Assess health risk
│   ├── POST   /extract-visit     # Extract visit data from voice
│   └── POST   /nutrition-plan    # Generate nutrition plan
└── voice/
    ├── POST   /transcribe        # Transcribe audio to text
    └── POST   /synthesize        # Text to speech
```


#### Authentication Flow

```
1. User Login
   ├─> POST /api/v1/auth/login
   ├─> Validate credentials (bcrypt)
   ├─> Generate JWT access token (30 min expiry)
   ├─> Generate refresh token (7 days expiry)
   └─> Return tokens + user info

2. Authenticated Request
   ├─> Include: Authorization: Bearer <access_token>
   ├─> Middleware validates JWT
   ├─> Extract user_id from token
   └─> Inject current_user into request

3. Token Refresh
   ├─> POST /api/v1/auth/refresh
   ├─> Validate refresh token
   ├─> Generate new access token
   └─> Return new access token

4. Logout
   ├─> Client discards tokens
   └─> Optional: Blacklist token (if implemented)
```
## 🤖 AI/ML Architecture

### Gemini AI Integration

### AI Features Implementation

#### 1. Chat with ASHA Didi

**System Prompt** (Hindi):
```
आप "आशा दीदी" हैं, ग्रामीण भारतीय महिलाओं के लिए एक विश्वसनीय मातृ स्वास्थ्य साथी।

मूल व्यक्तित्व:
- गर्मजोशी भरा, मातृत्व भाव, बिना किसी निर्णय के
- बड़ी बहन या भरोसेमंद पड़ोसी की तरह बात करें
- सरल हिंदी का उपयोग करें

जवाब के नियम:
1. जवाब 200 शब्दों से कम रखें
2. रोज़मर्रा की भाषा का उपयोग करें
3. आपातकालीन लक्षणों पर कहें: "यह गंभीर है। कृपया तुरंत Red Zone बटन दबाएं।"
4. कभी भी रोग निदान न करें
5. आराम + कार्रवाई योग्य अगले कदम प्रदान करें
```

**Intent Detection**:
- menstrual_query: Period-related questions
- pregnancy_query: Pregnancy symptoms/concerns
- nutrition_query: Diet and food recommendations
- mental_health_query: Emotional wellbeing
- scheme_query: Government benefits
- ifa_query: Iron-Folic Acid tablets
- emergency: Critical symptoms detected

**Emergency Keyword Detection**:
```python
EMERGENCY_KEYWORDS = [
    'खून', 'bleeding', 'बहुत दर्द', 'severe pain',
    'behosh', 'unconscious', 'chakkar', 'dizzy',
    'bukhar', 'fever', 'baby not moving', 'convulsion'
]
```


#### 2. Medical Data Extraction

**Input**: Voice transcription from ASHA worker visit
**Output**: Structured JSON with:
- Blood pressure (systolic/diastolic)
- Symptoms array
- Mood detection
- Emergency flag

**Example**:
```json
{
  "bp_systolic": 140,
  "bp_diastolic": 90,
  "symptoms": ["headache", "swelling", "dizziness"],
  "mood": "anxious",
  "is_emergency": true
}
```

#### 3. Risk Assessment

**Algorithm**:
1. Check for critical symptoms → risk_level = "critical", trigger SOS
2. Check BP thresholds (≥140/90) → risk_level = "high"
3. Count symptoms (≥3) → risk_level = "medium"
4. Default → risk_level = "low"

**Output**:
```json
{
  "risk_level": "high",
  "guidance": "Aapka blood pressure thoda zyada hai. ASHA didi se milein.",
  "should_trigger_sos": false
}
```

#### 4. Visit Data Extraction

**Input**: ASHA worker's voice notes
**Output**: Structured visit record with:
- Patient identification
- Visit type classification
- Vitals extraction
- Services and medicines documented
- Follow-up scheduling
- Referral recommendations


---

## 🎤 Voice Processing Architecture

Web Speech API (Browser-native) & OpenAI Whisper 
- Better accuracy for noisy environments
- Supports all 11 languages

### Language Detection

**Auto-detection Strategy**:
1. Analyze script/characters in user input
2. Detect Devanagari → Hindi/Marathi
3. Detect Tamil script → Tamil
4. Detect Latin script → English
5. Use language from previous message in session


---

## 🔐 Security Architecture

### Authentication & Authorization

**JWT Token Structure**:
```json
{
  "sub": "user_id",
  "role": "asha_worker",
  "exp": 1234567890,
  "iat": 1234567890
}
```

**Token Lifecycle**:
- Access Token: 30 minutes expiry
- Refresh Token: 7 days expiry
- Stored in httpOnly cookies (production) or localStorage (dev)

**Role-Based Access Control (RBAC)** 

### Data Encryption

**At Rest**:
- Sensitive fields (Aadhaar, phone) encrypted using Fernet (symmetric)
- Database-level encryption (Neon DB SSL)

**In Transit**:
- HTTPS/TLS 1.3 for all API calls
- SSL connections to PostgreSQL


### API Security Measures

1. **CORS Policy**: Whitelist frontend origins only
2. **Rate Limiting**: 100 requests/minute per IP
3. **Input Validation**: Pydantic schemas for all inputs
4. **SQL Injection Prevention**: Parameterized queries via SQLAlchemy
5. **XSS Protection**: Content-Security-Policy headers
6. **CSRF Protection**: SameSite cookies + CSRF tokens

---

## 📊 Data Flow Diagrams

### Beneficiary Voice Query Flow

```
User speaks → Web Speech API → Transcript
                                    ↓
                            Frontend validates
                                    ↓
                    POST /api/v1/ai/chat {message, language}
                                    ↓
                            Backend receives
                                    ↓
                    Emergency keyword check
                    ├─ Yes → Return emergency response
                    └─ No  → Continue
                                    ↓
                    Intent detection (menstrual/pregnancy/nutrition)
                                    ↓
                    Build system prompt + conversation history
                                    ↓
                    Call Gemini API
                                    ↓
                    Parse AI response
                                    ↓
                    Store in ai_chat_history table
                                    ↓
                    Return {message, intent, category, isEmergency}
                                    ↓
                    Frontend displays + TTS playback
```


### ASHA Worker Visit Recording Flow

```
ASHA worker speaks visit notes
            ↓
    Web Speech API → Transcript
            ↓
    POST /api/v1/ai/extract-visit {transcription}
            ↓
    Gemini extracts structured data:
    - Patient name
    - Vitals (BP, weight, temp)
    - Symptoms
    - Services provided
    - Medicines distributed
    - Follow-up needed
            ↓
    Frontend pre-fills visit form
            ↓
    ASHA worker reviews/edits
            ↓
    POST /api/v1/visits/ {visit_data}
            ↓
    Backend saves to visits table
            ↓
    Risk assessment triggered
    ├─ High risk → Create alert
    └─ Low risk → No action
            ↓
    Return success + visit_id
            ↓
    Frontend shows confirmation
```

### Offline Sync Flow

```
User performs action (offline)
            ↓
    Store in IndexedDB sync queue
    {action: 'CREATE_LOG', data: {...}, timestamp}
            ↓
    Network detected (online event)
            ↓
    Process sync queue sequentially
            ↓
    For each item:
    ├─ POST to API
    ├─ Success → Remove from queue
    └─ Failure → Keep in queue, retry later
            ↓
    Update UI with synced data
            ↓
    Show toast: "Data synced successfully"
```
