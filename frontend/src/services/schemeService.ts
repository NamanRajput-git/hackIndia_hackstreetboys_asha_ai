import apiClient from '../lib/api';
import { Scheme } from '../types';

export interface SchemeCreateData {
    scheme_name: string;
    provider: 'Govt' | 'NGO';
    category: 'financial' | 'nutrition' | 'health';
    description?: string;
    hero_image?: string;
    benefits?: string[];
    eligibility_criteria?: string[];
    target_audience?: any;
    status?: 'active' | 'draft' | 'closed';
    budget?: number;
    start_date?: string;
    end_date?: string;
    microsite_config?: any;
}

// Transform API response to frontend format
const transformScheme = (data: any): Scheme => ({
    id: data.id,
    title: data.scheme_name,
    description: data.description,
    provider: data.provider,
    category: data.category,
    heroImage: data.hero_image,
    benefits: data.benefits || [],
    eligibilityCriteria: data.eligibility_criteria || [],
    targetAudience: data.target_audience,
    status: data.status,
    budget: data.budget,
    enrolledCount: data.enrolled_count || 0,
    startDate: data.start_date,
    endDate: data.end_date,
    micrositeConfig: data.microsite_config,
});

// Transform frontend format to API format
const transformToApi = (data: Partial<Scheme>): Partial<SchemeCreateData> => {
    const result: any = {};
    if (data.title !== undefined) result.scheme_name = data.title;
    if (data.description !== undefined) result.description = data.description;
    if (data.provider !== undefined) result.provider = data.provider;
    if (data.category !== undefined) result.category = data.category;
    if (data.heroImage !== undefined) result.hero_image = data.heroImage;
    if (data.benefits !== undefined) result.benefits = data.benefits;
    if (data.eligibilityCriteria !== undefined) result.eligibility_criteria = data.eligibilityCriteria;
    if (data.targetAudience !== undefined) result.target_audience = data.targetAudience;
    if (data.status !== undefined) result.status = data.status;
    if (data.budget !== undefined) result.budget = data.budget;
    if (data.startDate !== undefined) result.start_date = data.startDate;
    if (data.endDate !== undefined) result.end_date = data.endDate;
    if (data.micrositeConfig !== undefined) result.microsite_config = data.micrositeConfig;
    return result;
};

export const schemeService = {
    /**
     * List schemes
     */
    list: async (params?: {
        status?: string;
        category?: string;
        provider?: string;
        search?: string;
        skip?: number;
        limit?: number;
    }): Promise<Scheme[]> => {
        const response = await apiClient.get('/schemes/', { params });
        return response.data.map(transformScheme);
    },

    /**
     * Get active schemes
     */
    getActive: async (): Promise<Scheme[]> => {
        const response = await apiClient.get('/schemes/active');
        return response.data.map(transformScheme);
    },

    /**
     * Get a specific scheme
     */
    get: async (id: string): Promise<Scheme> => {
        const response = await apiClient.get(`/schemes/${id}`);
        return transformScheme(response.data);
    },

    /**
     * Create a scheme
     */
    create: async (data: Omit<Scheme, 'id' | 'enrolledCount'>): Promise<Scheme> => {
        const apiData = transformToApi(data);
        const response = await apiClient.post('/schemes/', apiData);
        return transformScheme(response.data);
    },

    /**
     * Update a scheme
     */
    update: async (id: string, data: Partial<Scheme>): Promise<Scheme> => {
        const apiData = transformToApi(data);
        const response = await apiClient.put(`/schemes/${id}`, apiData);
        return transformScheme(response.data);
    },

    /**
     * Delete a scheme
     */
    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/schemes/${id}`);
    },

    /**
     * Get scheme statistics
     */
    getStats: async (id: string): Promise<any> => {
        const response = await apiClient.get(`/schemes/${id}/stats`);
        return response.data;
    },
};

export default schemeService;
