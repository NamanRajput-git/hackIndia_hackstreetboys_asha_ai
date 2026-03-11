export type Role = 'beneficiary' | 'asha_worker' | 'partner';
export type Language = 'en' | 'hi' | 'bho' | 'pa' | 'mr';

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar?: string;
}

export interface Child {
  id: string;
  beneficiaryId: string;
  name: string;
  dob: string; // YYYY-MM-DD
  gender: 'male' | 'female';
  bloodGroup?: string;
  vaccinations?: string[]; // Array of vaccine names taken
}

// --- Campaign Microsite Types ---
export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'file';
  options?: string[]; // For select type
  required: boolean;
}

export interface CampaignTask {
  id: string;
  title: string;
  description?: string;
  isMandatory: boolean;
}

export interface MicrositeConfig {
  themeColor: string;
  aboutSection: {
    title: string;
    content: string;
    image?: string;
  };
  tasks: CampaignTask[];
  customFormFields: FormField[];
}

export interface BeneficiaryProfile {
  id: string;
  userId: string;
  name: string;
  // Enhanced Fields
  userType: 'girl' | 'pregnant' | 'mother';
  age?: number;
  height?: number; // in cm
  weight?: number; // in kg
  bloodGroup?: string;

  pregnancyStage?: 'trimester_1' | 'trimester_2' | 'trimester_3' | 'postpartum';
  pregnancyWeek?: number;
  lastPeriodDate?: string;
  edd?: string; // Expected delivery date
  anemiaStatus?: 'normal' | 'mild' | 'moderate' | 'severe';
  riskLevel?: 'low' | 'medium' | 'high';
  location?: { lat: number; lng: number }; // Made optional
  gps_coords?: { lat: number; lng: number }; // New field matching DB
  address?: string; // New field
  linkedAshaId?: string;
  nextCheckup?: string;
  economicStatus?: 'bpl' | 'apl';

  // New Extensive Fields
  medicalHistory?: string;
  currentMedications?: string;
  complications?: string;
}

export interface HealthLog {
  id: string;
  beneficiaryId: string;
  date: string;
  bpSystolic: number;
  bpDiastolic: number;
  symptoms: string[];
  mood: string;
  isEmergency: boolean;
}

export interface DailyLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  symptoms: string[];
  mood: 'Happy' | 'Neutral' | 'Sad' | 'Tired' | 'Anxious' | 'Pain';
  notes: string;
  flow?: 'Light' | 'Medium' | 'Heavy';
}

export interface Alert {
  id: string;
  beneficiaryId: string;
  severity: 'medium' | 'high' | 'critical';
  status: 'open' | 'resolved';
  timestamp: string;
  type: 'sos' | 'health_risk';
  reason?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  triggeredBy?: string;
  resolutionNotes?: string;
}

export interface Scheme {
  id: string;
  title: string;
  provider: 'Govt' | 'NGO';
  description: string;
  heroImage: string;
  benefits: string[];
  eligibilityCriteria: string[];
  targetAudience: {
    pregnancyStage?: string[];
    economicStatus?: string[];
    riskLevel?: string[];
    userTypes?: ('girl' | 'pregnant' | 'mother')[];
  };
  status: 'active' | 'draft' | 'closed';
  budget: number;
  enrolledCount: number;
  startDate: string;
  endDate?: string;
  category?: 'financial' | 'nutrition' | 'health';
  micrositeConfig?: MicrositeConfig;
}

export interface Enrollment {
  id: string;
  schemeId: string;
  beneficiaryId: string;
  status: 'active' | 'completed' | 'rejected';
  enrolledBy: string;
  date: string;
}

// --- Offline Sync Types ---
export type SyncActionType =
  | 'ADD_DAILY_LOG'
  | 'ADD_HEALTH_LOG'
  | 'TRIGGER_SOS'
  | 'ENROLL_SCHEME'
  | 'UPDATE_PROFILE'
  | 'ADD_CHILD'
  | 'ADD_SCHEME'
  | 'UPDATE_SCHEME';

export interface SyncQueueItem {
  id: string;
  type: SyncActionType;
  payload: any;
  timestamp: number;
  retryCount: number;
}
