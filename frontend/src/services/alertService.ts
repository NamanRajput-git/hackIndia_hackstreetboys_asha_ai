import apiClient from '../lib/api';
import { Alert } from '../types';

export interface AlertCreateData {
    beneficiary_id: string;
    type: 'sos' | 'health_risk';
    severity: 'medium' | 'high' | 'critical';
    reason?: string;
}

// Transform API response to frontend format
const transformAlert = (data: any): Alert => ({
    id: data.id,
    beneficiaryId: data.beneficiary_id,
    type: data.type,
    severity: data.severity,
    status: data.status,
    timestamp: data.created_at,
    reason: data.reason,
    resolvedAt: data.resolved_at,
    resolvedBy: data.resolved_by,
});

export const alertService = {
    /**
     * List alerts
     */
    list: async (params?: {
        status?: string;
        severity?: string;
        skip?: number;
        limit?: number;
    }): Promise<Alert[]> => {
        const response = await apiClient.get('/alerts/', { params });
        return response.data.map(transformAlert);
    },

    /**
     * Get active/open alerts
     */
    getActive: async (): Promise<Alert[]> => {
        const response = await apiClient.get('/alerts/active');
        return response.data.map(transformAlert);
    },

    /**
     * Get a specific alert
     */
    get: async (id: string): Promise<Alert> => {
        const response = await apiClient.get(`/alerts/${id}`);
        return transformAlert(response.data);
    },

    /**
     * Create an alert
     */
    create: async (data: AlertCreateData): Promise<Alert> => {
        const response = await apiClient.post('/alerts/', data);
        return transformAlert(response.data);
    },

    /**
     * Trigger SOS for a beneficiary
     */
    triggerSOS: async (beneficiaryId: string): Promise<Alert> => {
        const response = await apiClient.post(`/alerts/sos/${beneficiaryId}`);
        return transformAlert(response.data);
    },

    /**
     * Update an alert
     */
    update: async (id: string, data: Partial<{ status: string; resolution_notes?: string }>): Promise<Alert> => {
        const response = await apiClient.put(`/alerts/${id}`, data);
        return transformAlert(response.data);
    },

    /**
     * Resolve an alert
     */
    resolve: async (id: string, notes?: string): Promise<Alert> => {
        const response = await apiClient.post(`/alerts/${id}/resolve`, null, {
            params: { resolution_notes: notes },
        });
        return transformAlert(response.data);
    },
};

export default alertService;
