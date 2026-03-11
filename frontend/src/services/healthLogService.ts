import apiClient from '../lib/api';
import { HealthLog } from '../types';

export interface HealthLogCreateData {
    beneficiary_id: string;
    bp_systolic?: number;
    bp_diastolic?: number;
    symptoms?: string[];
    mood?: string;
    voice_note_url?: string;
    ai_summary?: string;
    is_emergency?: boolean;
    visit_type?: string;
}

// Transform API response to frontend format
const transformHealthLog = (data: any): HealthLog => ({
    id: data.id,
    beneficiaryId: data.beneficiary_id,
    date: data.date,
    bpSystolic: data.bp_systolic || data.vitals?.bpSystolic,
    bpDiastolic: data.bp_diastolic || data.vitals?.bpDiastolic,
    symptoms: data.symptoms || [],
    mood: data.mood,
    isEmergency: data.is_emergency,
});

// Transform frontend format to API format
const transformToApi = (data: Partial<HealthLog>): Partial<HealthLogCreateData> => {
    const result: any = {};
    if (data.beneficiaryId !== undefined) result.beneficiary_id = data.beneficiaryId;
    if (data.bpSystolic !== undefined) result.bp_systolic = data.bpSystolic;
    if (data.bpDiastolic !== undefined) result.bp_diastolic = data.bpDiastolic;
    if (data.symptoms !== undefined) result.symptoms = data.symptoms;
    if (data.mood !== undefined) result.mood = data.mood;
    if (data.isEmergency !== undefined) result.is_emergency = data.isEmergency;
    return result;
};

export const healthLogService = {
    /**
     * List health logs
     */
    list: async (params?: {
        beneficiary_id?: string;
        is_emergency?: boolean;
        skip?: number;
        limit?: number;
    }): Promise<HealthLog[]> => {
        const response = await apiClient.get('/health-logs/', { params });
        return response.data.map(transformHealthLog);
    },

    /**
     * Get a specific health log
     */
    get: async (id: string): Promise<HealthLog> => {
        const response = await apiClient.get(`/health-logs/${id}`);
        return transformHealthLog(response.data);
    },

    /**
     * Create a health log
     */
    create: async (data: Omit<HealthLog, 'id'>): Promise<HealthLog> => {
        const apiData = transformToApi(data);
        const response = await apiClient.post('/health-logs/', apiData);
        return transformHealthLog(response.data);
    },

    /**
     * Update a health log
     */
    update: async (id: string, data: Partial<HealthLog>): Promise<HealthLog> => {
        const apiData = transformToApi(data);
        const response = await apiClient.put(`/health-logs/${id}`, apiData);
        return transformHealthLog(response.data);
    },

    /**
     * Delete a health log
     */
    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/health-logs/${id}`);
    },
};

export default healthLogService;
