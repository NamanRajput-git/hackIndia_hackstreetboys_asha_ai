/**
 * Voice Agent Service - End-to-end voice processing pipeline
 * 
 * This service handles:
 * 1. Audio transcription via Whisper API
 * 2. AI chat with ASHA Didi via Gemini
 * 3. Text-to-speech playback
 * 4. Emergency detection and logging
 */

import apiClient from '../lib/api';
import { useStore } from '../store/useStore';

// ============================================================================
// Types
// ============================================================================

export interface TranscriptionResult {
    transcript: string;
    language: string;
    confidence: number;
    duration?: number;
}

export interface ChatResponse {
    message: string;
    isEmergency: boolean;
    intent: string | null;
    category: string | null;
}

export interface VoiceAgentResult {
    transcript: string;
    response: string;
    language: string;
    isEmergency: boolean;
    should_trigger_sos: boolean;
}

export interface ProcessVoiceResult {
    success: boolean;
    transcription: string;
    extractedData: Record<string, unknown>;
    confidenceScore: number;
    missingFields: string[];
    followUpQuestion: string | null;
    isComplete: boolean;
}

// ============================================================================
// Transcription Functions
// ============================================================================

/**
 * Transcribe audio blob using Whisper API
 */
export async function transcribeAudio(
    audioBlob: Blob,
    language?: string
): Promise<TranscriptionResult> {
    const formData = new FormData();

    // Determine extension from blob type
    const mimeType = audioBlob.type || 'audio/webm';
    let extension = 'webm';
    if (mimeType.includes('mp4')) extension = 'mp4';
    else if (mimeType.includes('wav')) extension = 'wav';
    else if (mimeType.includes('ogg')) extension = 'ogg';

    formData.append('audio', audioBlob, `recording.${extension}`);

    if (language) {
        formData.append('language', language);
    }

    console.log('[VoiceAgent] Sending audio for transcription...', {
        size: audioBlob.size,
        type: mimeType,
        language
    });

    const response = await apiClient.post('/voice/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000 // 120s timeout for transcription
    });

    console.log('[VoiceAgent] Transcription result:', response.data);

    return {
        transcript: response.data.transcript || '',
        language: response.data.language || language || 'hi',
        confidence: response.data.confidence || 0.9,
        duration: response.data.duration
    };
}

// ============================================================================
// Chat Functions
// ============================================================================

/**
 * Get AI chat response from ASHA Didi
 */
export async function getChatResponse(
    message: string,
    language: string = 'hi',
    conversationHistory: Array<{ role: string; content: string }> = []
): Promise<ChatResponse> {
    console.log('[VoiceAgent] Getting chat response...', { message: message.substring(0, 50), language });

    const response = await apiClient.post('/voice/chat', {
        message,
        language,
        conversation_history: conversationHistory
    });

    console.log('[VoiceAgent] Chat response:', response.data);

    return {
        message: response.data.message || '',
        isEmergency: response.data.isEmergency || false,
        intent: response.data.intent,
        category: response.data.category
    };
}

/**
 * Get AI health guidance (simple query-response)
 */
export async function getHealthGuidance(
    query: string,
    language: string = 'hi'
): Promise<string> {
    try {
        const response = await apiClient.post('/ai/health-query', {
            query,
            language
        });
        return response.data.guidance || response.data.message || '';
    } catch (error) {
        console.error('[VoiceAgent] Health guidance error:', error);
        return language === 'hi'
            ? 'माफ़ करें, अभी जवाब देने में समस्या है।'
            : 'Sorry, there was an issue getting a response.';
    }
}

// ============================================================================
// Full Pipeline Functions
// ============================================================================

/**
 * Complete voice processing pipeline:
 * 1. Transcribe audio
 * 2. Get AI response
 * 3. Log interaction
 * 4. Trigger SOS if emergency
 */
export async function processVoiceInput(
    audioBlob: Blob,
    preferredLanguage: string = 'hi',
    beneficiaryId?: string
): Promise<VoiceAgentResult> {
    console.log('[VoiceAgent] Starting voice processing pipeline...');

    // Step 1: Transcribe audio
    const transcription = await transcribeAudio(audioBlob, preferredLanguage);
    const transcript = transcription.transcript;
    const detectedLanguage = transcription.language || preferredLanguage;

    if (!transcript || transcript.trim() === '') {
        throw new Error('No speech detected. Please try again.');
    }

    console.log('[VoiceAgent] Transcript:', transcript);

    // Step 2: Get AI response
    const chatResponse = await getChatResponse(transcript, detectedLanguage);

    // Step 3: Determine if this requires SOS trigger
    const shouldTriggerSOS = !!(chatResponse.isEmergency && beneficiaryId);

    // Step 4: Log the interaction to database
    try {
        await apiClient.post('/voice/log', {
            user_message: transcript,
            ai_response: chatResponse.message,
            language_used: detectedLanguage,
            is_emergency: chatResponse.isEmergency,
            beneficiary_id: beneficiaryId,
            intent: chatResponse.intent,
            category: chatResponse.category,
        });
        console.log('[VoiceAgent] Interaction logged to database');
    } catch (error) {
        console.error('[VoiceAgent] Failed to log interaction:', error);
        // Don't fail the whole pipeline if logging fails
    }

    // Step 5: Trigger SOS if needed
    if (shouldTriggerSOS && beneficiaryId) {
        try {
            const store = useStore.getState();
            await store.triggerSOS(beneficiaryId);
            console.log('[VoiceAgent] SOS triggered for beneficiary:', beneficiaryId);
        } catch (error) {
            console.error('[VoiceAgent] Failed to trigger SOS:', error);
        }
    }

    return {
        transcript,
        response: chatResponse.message,
        language: detectedLanguage,
        isEmergency: chatResponse.isEmergency,
        should_trigger_sos: shouldTriggerSOS,
    };
}

/**
 * Process voice for ASHA workers - extracts structured visit data
 */
export async function processAshaVoice(
    audioBlob: Blob,
    language: string = 'hi'
): Promise<ProcessVoiceResult> {
    const formData = new FormData();

    const mimeType = audioBlob.type || 'audio/webm';
    let extension = 'webm';
    if (mimeType.includes('mp4')) extension = 'mp4';
    else if (mimeType.includes('wav')) extension = 'wav';

    formData.append('audio', audioBlob, `recording.${extension}`);
    formData.append('language', language);

    console.log('[VoiceAgent] Processing ASHA voice recording...');

    const response = await apiClient.post('/voice/process', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000 // 120s timeout for full processing
    });

    console.log('[VoiceAgent] ASHA voice processing result:', response.data);

    return response.data;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extract structured visit data from voice transcription (for ASHA workers)
 */
export async function extractVisitData(
    transcription: string
): Promise<Record<string, unknown>> {
    try {
        const response = await apiClient.post('/ai/extract-visit-data', {
            text: transcription,
        });
        return response.data;
    } catch (error) {
        console.error('[VoiceAgent] Visit data extraction failed:', error);
        return {};
    }
}

/**
 * Get chat history for a beneficiary
 */
export async function getChatHistory(
    beneficiaryId?: string,
    limit: number = 20
): Promise<Array<{
    id: string;
    user_message: string;
    ai_response: string;
    language: string;
    is_emergency: boolean;
    created_at: string;
}>> {
    try {
        const params: Record<string, unknown> = { limit };
        if (beneficiaryId) {
            params.beneficiary_id = beneficiaryId;
        }

        const response = await apiClient.get('/voice/history', { params });
        return response.data;
    } catch (error) {
        console.error('[VoiceAgent] Failed to get chat history:', error);
        return [];
    }
}

/**
 * Get emergency count for ASHA dashboard
 */
export async function getEmergencyCount(): Promise<number> {
    try {
        const response = await apiClient.get('/voice/emergency-count');
        return response.data.emergency_count || 0;
    } catch (error) {
        console.error('[VoiceAgent] Failed to get emergency count:', error);
        return 0;
    }
}

// ============================================================================
// Exports
// ============================================================================

export default {
    transcribeAudio,
    getChatResponse,
    getHealthGuidance,
    processVoiceInput,
    processAshaVoice,
    extractVisitData,
    getChatHistory,
    getEmergencyCount
};
