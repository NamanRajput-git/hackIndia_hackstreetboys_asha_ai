import apiClient from '../lib/api';

export type VisitStatus = 'scheduled' | 'completed' | 'cancelled' | 'missed';
export type VisitPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Visit {
    id: string;
    beneficiaryId: string;
    ashaWorkerId: string;
    scheduledDate: string;
    scheduledTime?: string;
    visitType: string;
    purpose?: string;
    notes?: string;
    status: VisitStatus;
    priority: VisitPriority;
    completedAt?: string;
    healthLogId?: string;
    createdAt: string;
    updatedAt: string;
    // Enriched fields
    beneficiaryName?: string;
    beneficiaryUserType?: string;
    beneficiaryRiskLevel?: string;
    beneficiaryAddress?: string;
    ashaWorkerName?: string;
}

export interface VisitCreateData {
    beneficiary_id: string;
    scheduled_date: string;
    scheduled_time?: string;
    visit_type?: string;
    purpose?: string;
    notes?: string;
    priority?: VisitPriority;
}

export interface VisitUpdateData {
    scheduled_date?: string;
    scheduled_time?: string;
    visit_type?: string;
    purpose?: string;
    notes?: string;
    status?: VisitStatus;
    priority?: VisitPriority;
}

export interface VisitListResponse {
    visits: Visit[];
    total: number;
    todayCount: number;
    overdueCount: number;
}

// Transform API response to frontend format
const transformVisit = (data: any): Visit => ({
    id: data.id,
    beneficiaryId: data.beneficiary_id,
    ashaWorkerId: data.asha_worker_id,
    scheduledDate: data.scheduled_date,
    scheduledTime: data.scheduled_time,
    visitType: data.visit_type,
    purpose: data.purpose,
    notes: data.notes,
    status: data.status,
    priority: data.priority,
    completedAt: data.completed_at,
    healthLogId: data.health_log_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    beneficiaryName: data.beneficiary_name,
    beneficiaryUserType: data.beneficiary_user_type,
    beneficiaryRiskLevel: data.beneficiary_risk_level,
    beneficiaryAddress: data.beneficiary_address,
    ashaWorkerName: data.asha_worker_name,
});

const transformListResponse = (data: any): VisitListResponse => ({
    visits: data.visits.map(transformVisit),
    total: data.total,
    todayCount: data.today_count,
    overdueCount: data.overdue_count,
});

export const visitService = {
    /**
     * List visits with optional filters
     */
    list: async (params?: {
        status?: VisitStatus;
        beneficiary_id?: string;
        from_date?: string;
        to_date?: string;
        skip?: number;
        limit?: number;
    }): Promise<VisitListResponse> => {
        const response = await apiClient.get('/visits/', { params });
        return transformListResponse(response.data);
    },

    /**
     * Get today's visits for the ASHA worker
     */
    getToday: async (): Promise<Visit[]> => {
        const response = await apiClient.get('/visits/today');
        return response.data.map(transformVisit);
    },

    /**
     * Get overdue visits
     */
    getOverdue: async (): Promise<Visit[]> => {
        const response = await apiClient.get('/visits/overdue');
        return response.data.map(transformVisit);
    },

    /**
     * Get a specific visit by ID
     */
    get: async (id: string): Promise<Visit> => {
        const response = await apiClient.get(`/visits/${id}`);
        return transformVisit(response.data);
    },

    /**
     * Schedule a new visit
     */
    create: async (data: VisitCreateData): Promise<Visit> => {
        const response = await apiClient.post('/visits/', data);
        return transformVisit(response.data);
    },

    /**
     * Update a visit
     */
    update: async (id: string, data: VisitUpdateData): Promise<Visit> => {
        const response = await apiClient.put(`/visits/${id}`, data);
        return transformVisit(response.data);
    },

    /**
     * Mark a visit as completed
     */
    complete: async (id: string, data?: {
        health_log_id?: string;
        notes?: string
    }): Promise<Visit> => {
        const response = await apiClient.post(`/visits/${id}/complete`, data || {});
        return transformVisit(response.data);
    },

    /**
     * Cancel a scheduled visit
     */
    cancel: async (id: string): Promise<Visit> => {
        const response = await apiClient.post(`/visits/${id}/cancel`);
        return transformVisit(response.data);
    },

    /**
     * Delete a visit
     */
    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/visits/${id}`);
    },
};

export default visitService;
