import apiClient from '../lib/api';
import { BeneficiaryProfile } from '../types';

export interface BeneficiaryCreateData {
    name: string;
    user_type?: 'girl' | 'pregnant' | 'mother';
    age?: number;
    height?: number;
    weight?: number;
    blood_group?: string;
    last_period_date?: string;
    pregnancy_stage?: string;
    pregnancy_week?: number;
    edd?: string;
    anemia_status?: 'normal' | 'mild' | 'moderate' | 'severe';
    risk_level?: 'low' | 'medium' | 'high';
    economic_status?: 'bpl' | 'apl';
    address?: string;
    gps_coords?: { lat: number; lng: number };
    medical_history?: string;
    current_medications?: string;
    complications?: string;
}

export interface BeneficiaryUpdateData extends Partial<BeneficiaryCreateData> {
    linked_asha_id?: string;
    next_checkup_date?: string;
}

// Transform API response to frontend format
const transformBeneficiary = (data: any): BeneficiaryProfile => ({
    id: data.id,
    userId: data.user_id,
    name: data.name,
    userType: data.user_type,
    age: data.age,
    height: data.height,
    weight: data.weight,
    bloodGroup: data.blood_group,
    lastPeriodDate: data.last_period_date,
    pregnancyStage: data.pregnancy_stage,
    pregnancyWeek: data.pregnancy_week,
    edd: data.edd,
    anemiaStatus: data.anemia_status,
    riskLevel: data.risk_level,
    economicStatus: data.economic_status,
    address: data.address,
    gps_coords: data.gps_coords,
    linkedAshaId: data.linked_asha_id,
    nextCheckup: data.next_checkup_date,
    medicalHistory: data.medical_history,
    currentMedications: data.current_medications,
    complications: data.complications,
});

// Transform frontend format to API format
const transformToApi = (data: Partial<BeneficiaryProfile>): BeneficiaryUpdateData => {
    const result: any = {};
    if (data.name !== undefined) result.name = data.name;
    if (data.userType !== undefined) result.user_type = data.userType;
    if (data.age !== undefined) result.age = data.age;
    if (data.height !== undefined) result.height = data.height;
    if (data.weight !== undefined) result.weight = data.weight;
    if (data.bloodGroup !== undefined) result.blood_group = data.bloodGroup;
    if (data.lastPeriodDate !== undefined) result.last_period_date = data.lastPeriodDate;
    if (data.pregnancyStage !== undefined) result.pregnancy_stage = data.pregnancyStage;
    if (data.pregnancyWeek !== undefined) result.pregnancy_week = data.pregnancyWeek;
    if (data.edd !== undefined) result.edd = data.edd;
    if (data.anemiaStatus !== undefined) result.anemia_status = data.anemiaStatus;
    if (data.riskLevel !== undefined) result.risk_level = data.riskLevel;
    if (data.economicStatus !== undefined) result.economic_status = data.economicStatus;
    if (data.address !== undefined) result.address = data.address;
    if (data.gps_coords !== undefined) result.gps_coords = data.gps_coords;
    if (data.linkedAshaId !== undefined) result.linked_asha_id = data.linkedAshaId;
    if (data.nextCheckup !== undefined) result.next_checkup_date = data.nextCheckup;
    if (data.medicalHistory !== undefined) result.medical_history = data.medicalHistory;
    if (data.currentMedications !== undefined) result.current_medications = data.currentMedications;
    if (data.complications !== undefined) result.complications = data.complications;
    return result;
};

export const beneficiaryService = {
    /**
     * List all beneficiaries
     */
    list: async (params?: {
        skip?: number;
        limit?: number;
        risk_level?: string;
        user_type?: string;
        search?: string;
    }): Promise<BeneficiaryProfile[]> => {
        const response = await apiClient.get('/beneficiaries/', { params });
        return response.data.map(transformBeneficiary);
    },

    /**
     * Get current user's beneficiary profile
     */
    getMyProfile: async (): Promise<BeneficiaryProfile | null> => {
        try {
            const response = await apiClient.get('/beneficiaries/my-profile');
            return transformBeneficiary(response.data);
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    },

    /**
     * Get a specific beneficiary by ID
     */
    get: async (id: string): Promise<BeneficiaryProfile> => {
        const response = await apiClient.get(`/beneficiaries/${id}`);
        return transformBeneficiary(response.data);
    },

    /**
     * Create a new beneficiary profile
     */
    create: async (data: BeneficiaryCreateData): Promise<BeneficiaryProfile> => {
        const response = await apiClient.post('/beneficiaries/', data);
        return transformBeneficiary(response.data);
    },

    /**
     * Update a beneficiary profile
     */
    update: async (id: string, data: Partial<BeneficiaryProfile>): Promise<BeneficiaryProfile> => {
        const apiData = transformToApi(data);
        const response = await apiClient.put(`/beneficiaries/${id}`, apiData);
        return transformBeneficiary(response.data);
    },

    /**
     * Delete a beneficiary
     */
    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/beneficiaries/${id}`);
    },
};

export default beneficiaryService;
