import apiClient from '../lib/api';
import { DailyLog } from '../types';

export interface DailyLogCreateData {
    date: string;
    mood?: 'Happy' | 'Neutral' | 'Sad' | 'Tired' | 'Anxious' | 'Pain';
    symptoms?: string[];
    notes?: string;
    flow?: 'Light' | 'Medium' | 'Heavy';
}

// Transform API response to frontend format
const transformDailyLog = (data: any): DailyLog => ({
    id: data.id,
    userId: data.user_id,
    date: data.date,
    mood: data.mood,
    symptoms: data.symptoms || [],
    notes: data.notes,
    flow: data.flow,
});

export const dailyLogService = {
    /**
     * List daily logs for current user
     */
    list: async (params?: {
        start_date?: string;
        end_date?: string;
        skip?: number;
        limit?: number;
    }): Promise<DailyLog[]> => {
        const response = await apiClient.get('/daily-logs/', { params });
        return response.data.map(transformDailyLog);
    },

    /**
     * Get today's log
     */
    getToday: async (): Promise<DailyLog | null> => {
        const response = await apiClient.get('/daily-logs/today');
        return response.data ? transformDailyLog(response.data) : null;
    },

    /**
     * Get a specific daily log
     */
    get: async (id: string): Promise<DailyLog> => {
        const response = await apiClient.get(`/daily-logs/${id}`);
        return transformDailyLog(response.data);
    },

    /**
     * Create or update a daily log (upsert by date)
     */
    create: async (data: DailyLogCreateData): Promise<DailyLog> => {
        const response = await apiClient.post('/daily-logs/', data);
        return transformDailyLog(response.data);
    },

    /**
     * Update a daily log
     */
    update: async (id: string, data: Partial<DailyLogCreateData>): Promise<DailyLog> => {
        const response = await apiClient.put(`/daily-logs/${id}`, data);
        return transformDailyLog(response.data);
    },

    /**
     * Delete a daily log
     */
    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/daily-logs/${id}`);
    },
};

export default dailyLogService;
