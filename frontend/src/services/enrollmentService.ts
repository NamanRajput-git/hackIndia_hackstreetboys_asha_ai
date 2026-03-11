import apiClient from '../lib/api';
import { Enrollment } from '../types';

export interface EnrollmentCreateData {
    scheme_id: string;
    beneficiary_id: string;
}

// Transform API response to frontend format
const transformEnrollment = (data: any): Enrollment => ({
    id: data.id,
    schemeId: data.scheme_id,
    beneficiaryId: data.beneficiary_id,
    status: data.status,
    enrolledBy: data.enrolled_by,
    date: data.enrollment_date,
});

export const enrollmentService = {
    /**
     * List enrollments
     */
    list: async (params?: {
        scheme_id?: string;
        beneficiary_id?: string;
        status?: string;
        skip?: number;
        limit?: number;
    }): Promise<Enrollment[]> => {
        const response = await apiClient.get('/enrollments/', { params });
        return response.data.map(transformEnrollment);
    },

    /**
     * Get current user's enrollments
     */
    getMyEnrollments: async (): Promise<Enrollment[]> => {
        const response = await apiClient.get('/enrollments/my-enrollments');
        return response.data.map(transformEnrollment);
    },

    /**
     * Get a specific enrollment
     */
    get: async (id: string): Promise<Enrollment> => {
        const response = await apiClient.get(`/enrollments/${id}`);
        return transformEnrollment(response.data);
    },

    /**
     * Enroll a beneficiary in a scheme
     */
    enroll: async (schemeId: string, beneficiaryId: string): Promise<Enrollment> => {
        const response = await apiClient.post('/enrollments/', {
            scheme_id: schemeId,
            beneficiary_id: beneficiaryId,
        });
        return transformEnrollment(response.data);
    },

    /**
     * Update an enrollment status
     */
    update: async (id: string, status: string): Promise<Enrollment> => {
        const response = await apiClient.put(`/enrollments/${id}`, { status });
        return transformEnrollment(response.data);
    },

    /**
     * Delete an enrollment
     */
    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/enrollments/${id}`);
    },
};

export default enrollmentService;
