# 🩺 ASHA AI - Voice-First Healthcare for Rural India

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6+-purple.svg)](https://vitejs.dev/)

> Bridging the last mile in rural healthcare through voice-AI technology

## 📖 Table of Contents

- [Overview](#-overview)
- [The Problem](#-the-problem)
- [Our Solution](#-our-solution)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Setup](#-environment-setup)
- [Multilingual Support](#-multilingual-support)
- [Contributors](#-contributors)

---

## 🌟 Overview

**ASHA AI** is a revolutionary voice-first healthcare platform designed to democratize healthcare access for rural Indian women. Built to work on low-end devices with intermittent connectivity, ASHA AI empowers women who face literacy barriers, social stigma, and limited access to healthcare professionals.

### 🎯 Mission

To provide dignified, private, and accessible healthcare guidance to underserved rural communities while supercharging the existing ASHA (Accredited Social Health Activist) workforce with intelligent digital tools.

---

## 🚨 The Problem

### **Meet Radha**
Radha is 19 years old, pregnant, and anemic. She lives in a village in Bihar where:

- ❌ **Literacy Barrier**: Cannot read medical pamphlets or text-based health apps
- ❌ **Social Stigma**: Too shy to discuss reproductive health with family or male doctors
- ❌ **Overburdened System**: Her ASHA worker visits once a month and manages 1,000+ villagers

> *"I have questions, but I don't know who to ask..."* - Radha, 19

### The Statistics
- 📊 **300 million** rural women lack accessible healthcare guidance
- 🏥 **1 ASHA worker** per 1,000 population
- 📱 **95%** of users cannot download mobile apps due to constraints
- 🔴 **High maternal mortality** due to delayed interventions

---

## 💡 Our Solution

### **ASHA AI solves this through:**

#### 🎤 **Voice-First Technology**
- No typing, no reading—just conversation in **11+ Indian languages**
- Supports: Hindi, Gujarati, Kannada, Tamil, Telugu, Malayalam, Marathi, Bengali, Punjabi, Bhojpuri, English
- If you can speak, you can use ASHA AI

#### 🔒 **Whisper Privacy Mode**
- Anonymous usage
- Auto-delete for shared phones
- Local storage for sensitive queries
- No judgment, complete privacy

#### 👩‍⚕️ **ASHA Worker Empowerment**
- Digital assistant for health workers
- Real-time high-risk alerts
- Auto-digitized visit records
- Village-level health analytics

---

## ✨ Key Features

### **For Rural Women**

#### 🩺 **Symptom Checker**
- Voice-based symptom reporting in local dialects
- AI-powered triage using WHO medical protocols
- Instant advice with doctor-verified responses
- Audio playback for responses

#### 📅 **Voice Period Tracker**
- No calendar needed—just speak: *"Meri date aaj aayi hai"*
- Tracks cycles, predicts fertile windows
- Identifies irregularities and health risks
- Visual calendar with voice logging

#### 🥗 **Nutrition Planner**
- Iron-rich meal planning using low-cost local foods (jaggery, greens)
- Anemia prevention guidance
- IFA tablet reminders
- Audio micro-lessons (30-45 seconds)

#### 🎓 **Audio Micro-Lessons**
- Bite-sized health education
- Topics: Hygiene, puberty, pregnancy danger signs
- Accessible without reading

---

## 🛠️ Tech Stack

### Frontend
- **React 18+** with TypeScript
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations

### AI/ML Services
- **Mistral AI** - Multilingual chat responses
- **Web Speech API** - Browser-based STT/TTS
- **Whisper (Optional)** - OpenAI speech recognition

### Voice Technologies
- **Speech Recognition API** - 11+ Indian languages
- **Speech Synthesis API** - Text-to-speech output
- **Auto Language Detection** - Responds in user's language

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Modern browser** (Chrome/Edge recommended for best voice support)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/asha-ai.git
   cd asha-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   ```env
   VITE_MISTRAL_API_KEY=your_mistral_api_key_here
   VITE_OPENAI_API_KEY=your_openai_api_key_here  # Optional
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

---

## 🔐 Environment Setup

### Required API Keys

#### Mistral AI (Required for Chat)
1. Visit [Mistral AI Console](https://console.mistral.ai/)
2. Sign up and create an API key
3. Add to `.env` as `VITE_MISTRAL_API_KEY`

#### OpenAI (Optional - for Whisper STT)
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an API key
3. Add to `.env` as `VITE_OPENAI_API_KEY`

> **Note:** The app works with browser Web Speech API by default. OpenAI Whisper is optional for enhanced accuracy.

---

## 🌍 Multilingual Support

### Supported Languages

ASHA AI supports **11 Indian languages** plus English:

| Language | Code | STT Support | TTS Support |
|----------|------|-------------|-------------|
| Hindi | `hi` | ✅ | ✅ |
| Gujarati | `gu` | ✅ | ✅ |
| Kannada | `kn` | ✅ | ✅ |
| Tamil | `ta` | ✅ | ✅ |
| Telugu | `te` | ✅ | ✅ |
| Malayalam | `ml` | ✅ | ✅ |
| Marathi | `mr` | ✅ | ✅ |
| Bengali | `bn` | ✅ | ✅ |
| Punjabi | `pa` | ✅ | ✅ |
| Bhojpuri | `bh` | ✅ (Hindi fallback) | ✅ (Hindi fallback) |
| English | `en` | ✅ | ✅ |

### Auto Language Detection

- **Speech Input**: System detects script/characters automatically
- **Chat Responses**: AI responds in the same language as user input
- **No Manual Selection**: Just speak in your preferred language

### Example Usage

```javascript
// Hindi
User: "मुझे पेट में दर्द है"
AI: "आपको पेट में दर्द कैसा है? कब से है?"

// Tamil
User: "எனக்கு தலைவலி இருக்கிறது"
AI: "உங்கள் தலைவலி எப்போது தொடங்கியது?"

// Gujarati
User: "મને માથાનો દુખાવો છે"
AI: "તમારો માથાનો દુખાવો ક્યારે શરૂ થયો?"
```

---

## 📦 Build for Production

```bash
npm run build
npm run preview
```

### Deploy to Netlify

The project includes `netlify.toml` configuration:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

**Remember:** Add environment variables in Netlify dashboard under Site Settings → Build & Deploy → Environment

---

## 👥 Contributors

This project was built with ❤️ by:

-HackStreet-Boys
---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.


### 🌟 Star this repo if you believe in accessible healthcare for all!

**Built for Social Good** 🩺 | **Designed for Impact** 💪
</div>
