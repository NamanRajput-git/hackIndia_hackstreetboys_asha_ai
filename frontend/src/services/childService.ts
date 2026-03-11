import apiClient from '../lib/api';
import { Child } from '../types';

export interface ChildCreateData {
    beneficiary_id: string;
    name: string;
    dob?: string;
    gender?: 'male' | 'female';
    blood_group?: string;
    vaccinations?: string[];
}

// Transform API response to frontend format
const transformChild = (data: any): Child => ({
    id: data.id,
    beneficiaryId: data.beneficiary_id,
    name: data.name,
    dob: data.dob,
    gender: data.gender,
    bloodGroup: data.blood_group,
    vaccinations: data.vaccinations || [],
});

// Transform frontend format to API format
const transformToApi = (data: Partial<Child>): Partial<ChildCreateData> => {
    const result: any = {};
    if (data.beneficiaryId !== undefined) result.beneficiary_id = data.beneficiaryId;
    if (data.name !== undefined) result.name = data.name;
    if (data.dob !== undefined) result.dob = data.dob;
    if (data.gender !== undefined) result.gender = data.gender;
    if (data.bloodGroup !== undefined) result.blood_group = data.bloodGroup;
    if (data.vaccinations !== undefined) result.vaccinations = data.vaccinations;
    return result;
};

export const childService = {
    /**
     * List children
     */
    list: async (params?: {
        beneficiary_id?: string;
        skip?: number;
        limit?: number;
    }): Promise<Child[]> => {
        const response = await apiClient.get('/children/', { params });
        return response.data.map(transformChild);
    },

    /**
     * Get a specific child
     */
    get: async (id: string): Promise<Child> => {
        const response = await apiClient.get(`/children/${id}`);
        return transformChild(response.data);
    },

    /**
     * Create a child record
     */
    create: async (data: Omit<Child, 'id'>): Promise<Child> => {
        const apiData = transformToApi(data);
        const response = await apiClient.post('/children/', apiData);
        return transformChild(response.data);
    },

    /**
     * Update a child record
     */
    update: async (id: string, data: Partial<Child>): Promise<Child> => {
        const apiData = transformToApi(data);
        const response = await apiClient.put(`/children/${id}`, apiData);
        return transformChild(response.data);
    },

    /**
     * Delete a child record
     */
    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/children/${id}`);
    },

    /**
     * Mark a vaccination as completed (ASHA workers only)
     */
    markVaccinationDone: async (childId: string, vaccineId: string): Promise<Child> => {
        const response = await apiClient.post(`/children/${childId}/vaccinations/${vaccineId}`);
        return transformChild(response.data);
    },

    /**
     * Remove a vaccination record (ASHA workers only - for data correction)
     */
    removeVaccination: async (childId: string, vaccineId: string): Promise<Child> => {
        const response = await apiClient.delete(`/children/${childId}/vaccinations/${vaccineId}`);
        return transformChild(response.data);
    },
};

export default childService;
