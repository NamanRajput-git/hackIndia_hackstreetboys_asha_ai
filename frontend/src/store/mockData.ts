import { User, BeneficiaryProfile, Alert, Scheme, Enrollment } from '../types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Sunita Devi', role: 'beneficiary', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop' },
  { id: 'u2', name: 'Priya ASHA', role: 'asha_worker', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop' },
  { id: 'u3', name: 'Dr. Rajesh (Govt)', role: 'partner' },
  { id: 'u4', name: 'Anita Kumar', role: 'beneficiary' }
];

export const MOCK_BENEFICIARIES: BeneficiaryProfile[] = [
  {
    id: 'b1',
    userId: 'u1',
    name: 'Sunita Devi',
    userType: 'pregnant',
    height: 158,
    weight: 62,
    bloodGroup: 'B+',
    pregnancyStage: 'trimester_3',
    lastPeriodDate: '2024-08-15',
    anemiaStatus: 'mild',
    riskLevel: 'medium',
    location: { lat: 28.6139, lng: 77.2090 },
    linkedAshaId: 'u2',
    nextCheckup: '2025-05-20',
    economicStatus: 'bpl'
  },
  {
    id: 'b2',
    userId: 'u4', 
    name: 'Anita Kumar',
    userType: 'mother',
    height: 160,
    weight: 55,
    bloodGroup: 'O+',
    pregnancyStage: 'trimester_2',
    lastPeriodDate: '2024-11-01',
    anemiaStatus: 'severe',
    riskLevel: 'high',
    location: { lat: 28.6200, lng: 77.2100 },
    linkedAshaId: 'u2',
    nextCheckup: '2025-05-18',
    economicStatus: 'apl'
  }
];

export const MOCK_ALERTS: Alert[] = [
  {
    id: 'a1',
    beneficiaryId: 'b2',
    severity: 'high',
    status: 'open',
    timestamp: new Date().toISOString(),
    type: 'health_risk'
  }
];

export const MOCK_SCHEMES: Scheme[] = [
  {
    id: 's1',
    title: 'Janani Suraksha Yojana',
    provider: 'Govt',
    category: 'financial',
    description: 'Cash assistance for institutional delivery.',
    heroImage: 'https://cdn-icons-png.flaticon.com/512/2382/2382461.png', // Money/Shield Icon
    benefits: ['₹1400 Cash Assistance', 'Free Transport', 'Free Medicines'],
    eligibilityCriteria: ['Below Poverty Line (BPL)', 'Age > 19 Years'],
    targetAudience: {
      economicStatus: ['bpl'],
      pregnancyStage: ['trimester_3', 'postpartum']
    },
    status: 'active',
    budget: 5000000,
    enrolledCount: 1240,
    startDate: '2024-01-01'
  },
  {
    id: 's2',
    title: 'Poshan Abhiyaan',
    provider: 'NGO',
    category: 'nutrition',
    description: 'Nutrition baskets for anemic mothers.',
    heroImage: 'https://cdn-icons-png.flaticon.com/512/2913/2913465.png', // Fruit Basket Icon
    benefits: ['Weekly Fruit Basket', 'Iron Supplements', 'Protein Powder'],
    eligibilityCriteria: ['Anemia: Moderate/Severe', 'All Trimesters'],
    targetAudience: {
      riskLevel: ['medium', 'high']
    },
    status: 'active',
    budget: 1200000,
    enrolledCount: 450,
    startDate: '2024-03-15'
  },
  {
    id: 's3',
    title: 'Matru Vandana',
    provider: 'Govt',
    category: 'financial',
    description: 'Maternity benefit program for first child.',
    heroImage: 'https://cdn-icons-png.flaticon.com/512/1012/1012726.png', // Mother Icon
    benefits: ['₹5000 in 3 installments', 'Wage compensation'],
    eligibilityCriteria: ['First Live Birth', 'Registered at AWC'],
    targetAudience: {
      pregnancyStage: ['trimester_1', 'trimester_2']
    },
    status: 'active',
    budget: 8000000,
    enrolledCount: 3100,
    startDate: '2024-02-01'
  }
];

export const MOCK_ENROLLMENTS: Enrollment[] = [
  {
    id: 'e1',
    schemeId: 's1',
    beneficiaryId: 'b1',
    status: 'active', // Changed from 'approved' to 'active'
    enrolledBy: 'u2',
    date: '2024-04-10'
  }
];
