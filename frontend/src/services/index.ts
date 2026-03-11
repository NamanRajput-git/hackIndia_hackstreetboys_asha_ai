// Export all API services for easy import
export { default as apiClient, tokenManager } from '../lib/api';
export { default as authService } from '../lib/auth';
export { default as beneficiaryService } from './beneficiaryService';
export { default as dailyLogService } from './dailyLogService';
export { default as healthLogService } from './healthLogService';
export { default as alertService } from './alertService';
export { default as childService } from './childService';
export { default as schemeService } from './schemeService';
export { default as enrollmentService } from './enrollmentService';
export { default as visitService } from './visitService';
export {
    transcribeAudio,
    getChatResponse,
    getHealthGuidance,
    processVoiceInput,
    processAshaVoice,
    extractVisitData,
    getChatHistory,
    getEmergencyCount,
    default as voiceAgent
} from './voiceAgent';
export { default as aiService, simulateVoiceToText, simulateHindiResponse, simulateExtractMedicalData } from './ai';


// Re-export types for convenience
export type { LoginCredentials, RegisterData, AuthTokens } from '../lib/auth';
export type { BeneficiaryCreateData, BeneficiaryUpdateData } from './beneficiaryService';
export type { DailyLogCreateData } from './dailyLogService';
export type { HealthLogCreateData } from './healthLogService';
export type { AlertCreateData } from './alertService';
export type { ChildCreateData } from './childService';
export type { SchemeCreateData } from './schemeService';
export type { EnrollmentCreateData } from './enrollmentService';
export type { Visit, VisitCreateData, VisitUpdateData, VisitStatus, VisitPriority, VisitListResponse } from './visitService';
export type {
    VoiceTranscript,
    MedicalDataExtraction,
    RiskAssessment,
    HealthQueryRequest,
    NutritionPlanRequest,
    NutritionPlanResponse
} from './ai';
export type {
    TranscriptionResult,
    ChatResponse,
    VoiceAgentResult,
    ProcessVoiceResult
} from './voiceAgent';

