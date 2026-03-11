import apiClient, { tokenManager } from './api';
import { User } from '../types';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    full_name?: string;
    role?: 'beneficiary' | 'asha_worker' | 'partner' | 'admin';
    phone_number?: string;
    language?: string;
}

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

/**
 * Authentication Service - handles all auth-related API calls
 */
export const authService = {
    /**
     * Register a new user
     */
    register: async (data: RegisterData): Promise<User> => {
        const response = await apiClient.post('/auth/register', data);
        return response.data;
    },

    /**
     * Login with email and password
     */
    login: async (credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> => {
        // Get tokens
        const tokenResponse = await apiClient.post<AuthTokens>('/auth/login', credentials);
        const tokens = tokenResponse.data;

        // Save tokens
        tokenManager.setTokens(tokens.access_token, tokens.refresh_token);

        // Get user profile
        const userResponse = await apiClient.get<User>('/auth/me');
        const user = userResponse.data;

        return { user, tokens };
    },

    /**
     * Logout - clear tokens
     */
    logout: () => {
        tokenManager.clearTokens();
    },

    /**
     * Get current user profile
     */
    getCurrentUser: async (): Promise<User | null> => {
        if (!tokenManager.isAuthenticated()) {
            return null;
        }

        try {
            const response = await apiClient.get<User>('/auth/me');
            return response.data;
        } catch (error) {
            return null;
        }
    },

    /**
     * Update current user profile
     */
    updateProfile: async (data: Partial<User>): Promise<User> => {
        const response = await apiClient.put<User>('/auth/me', data);
        return response.data;
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated: () => tokenManager.isAuthenticated(),

    /**
     * Refresh access token
     */
    refreshToken: async (): Promise<AuthTokens | null> => {
        const refreshToken = tokenManager.getRefreshToken();
        if (!refreshToken) return null;

        try {
            const response = await apiClient.post<AuthTokens>('/auth/refresh', {
                refresh_token: refreshToken,
            });

            tokenManager.setTokens(response.data.access_token, response.data.refresh_token);
            return response.data;
        } catch (error) {
            tokenManager.clearTokens();
            return null;
        }
    },
};

export default authService;
