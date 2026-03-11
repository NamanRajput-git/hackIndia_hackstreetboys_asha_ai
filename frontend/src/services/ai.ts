import apiClient from '../lib/api';

export interface VoiceTranscript {
  transcript: string;
  beneficiary_id?: string;
  language?: string;
}

export interface MedicalDataExtraction {
  bp_systolic?: number;
  bp_diastolic?: number;
  symptoms: string[];
  mood?: string;
  is_emergency: boolean;
  raw_text?: string;
}

export interface RiskAssessment {
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  extracted_data: MedicalDataExtraction;
  guidance: string;
  should_trigger_sos: boolean;
}

export interface HealthQueryRequest {
  query: string;
  language?: string;
  context?: any;
}

export interface NutritionPlanRequest {
  user_type: 'girl' | 'pregnant' | 'mother';
  age?: number;
  weight?: number;
  height?: number;
  anemia_status?: string;
  pregnancy_week?: number;
  language?: string;
}

export interface NutritionPlanResponse {
  plan: any;
  recommendations: string[];
  iron_rich_foods: string[];
  meals: { name: string; description: string }[];
}

/**
 * AI Service - integrates with Gemini API through FastAPI backend
 */
/**
 * Simulate voice-to-text (mock for development when AI service is unavailable)
 */
export const simulateVoiceToText = async (): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("I visited Sunita today. Her blood pressure is 130 over 85. She is complaining of mild headache and fatigue. She looks a bit pale.");
    }, 2000);
  });
};

/**
 * Simulate Hindi response (mock for development)
 */
export const simulateHindiResponse = async (query: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const responses: Record<string, string> = {
        default: "Aapka sawaal samajh gaya. Kripya apni ASHA didi se milein agar koi gamhir samasya hai.",
        pain: "Agar dard zyada hai, toh turant doctor se milein. Thoda aaram karein aur paani piyein.",
        food: "Poshtik aahar lein - palak, gur, chana, aur hara saag khayein. Ye khoon badhane mein madad karta hai.",
      };

      const lowerQuery = query.toLowerCase();
      if (lowerQuery.includes('dard') || lowerQuery.includes('pain')) {
        resolve(responses.pain);
      } else if (lowerQuery.includes('khana') || lowerQuery.includes('food') || lowerQuery.includes('kya khau')) {
        resolve(responses.food);
      } else {
        resolve(responses.default);
      }
    }, 1500);
  });
};

/**
 * Simulate extracting medical data from text (mock for development)
 */
export const simulateExtractMedicalData = async (text: string): Promise<MedicalDataExtraction> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simple parsing for demo
      const bpMatch = text.match(/(\d{2,3})\s*(over|\/)\s*(\d{2,3})/i);
      const symptoms: string[] = [];

      if (text.toLowerCase().includes('headache') || text.toLowerCase().includes('sir dard')) {
        symptoms.push('Headache');
      }
      if (text.toLowerCase().includes('fatigue') || text.toLowerCase().includes('thakan')) {
        symptoms.push('Fatigue');
      }
      if (text.toLowerCase().includes('pale') || text.toLowerCase().includes('peela')) {
        symptoms.push('Pallor');
      }
      if (text.toLowerCase().includes('nausea') || text.toLowerCase().includes('ulti')) {
        symptoms.push('Nausea');
      }

      resolve({
        bp_systolic: bpMatch ? parseInt(bpMatch[1]) : undefined,
        bp_diastolic: bpMatch ? parseInt(bpMatch[3]) : undefined,
        symptoms,
        mood: symptoms.length > 2 ? 'Pain' : 'Neutral',
        is_emergency: text.toLowerCase().includes('emergency') || text.toLowerCase().includes('severe'),
        raw_text: text
      });
    }, 1000);
  });
};

export const aiService = {
  /**
   * Generate AI response from a prompt
   */
  generate: async (text: string): Promise<{ response: string; success: boolean; error?: string }> => {
    const response = await apiClient.post('/ai/generate', { text });
    return response.data;
  },

  /**
   * Analyze voice transcript and extract medical data with risk assessment
   */
  analyzeVoice: async (data: VoiceTranscript): Promise<RiskAssessment> => {
    const response = await apiClient.post('/ai/analyze-voice', data);
    return response.data;
  },

  /**
   * Get health guidance for a query
   */
  getHealthGuidance: async (query: string, language: string = 'hi'): Promise<string> => {
    const response = await apiClient.post('/ai/health-query', { query, language });
    return response.data.guidance;
  },

  /**
   * Generate personalized nutrition plan
   */
  generateNutritionPlan: async (data: NutritionPlanRequest): Promise<NutritionPlanResponse> => {
    const response = await apiClient.post('/ai/nutrition-plan', data);
    return response.data;
  },

  /**
   * Check AI service health
   */
  healthCheck: async (): Promise<{ status: string; gemini_api: boolean }> => {
    const response = await apiClient.get('/ai/health');
    return response.data;
  },

  /**
   * Simulate voice-to-text (mock for development)
   */
  simulateVoiceToText: async (): Promise<string> => {
    // This simulates what a real speech-to-text would return
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("I visited Sunita today. Her blood pressure is 130 over 85. She is complaining of mild headache and fatigue. She looks a bit pale.");
      }, 2000);
    });
  },

  /**
   * Extract medical data from voice/text (convenience method)
   */
  extractMedicalData: async (transcript: string): Promise<MedicalDataExtraction> => {
    const assessment = await aiService.analyzeVoice({ transcript });
    return assessment.extracted_data;
  },
};

export default aiService;
