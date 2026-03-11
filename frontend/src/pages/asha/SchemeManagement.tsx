/**
 * ASHA Scheme Management Page
 * 
 * Allows ASHA workers to:
 * 1. View all available schemes/campaigns
 * 2. Enroll beneficiaries in eligible schemes
 * 3. Remove beneficiaries from schemes
 * 4. View enrollment statistics
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, Plus, Trash2, Users,
    XCircle, RefreshCw, Loader2,
    Award, AlertCircle, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RoleLayout } from '../../components/layout/RoleLayout';
import { Button } from '../../components/ui/Button';
import { useStore } from '../../store/useStore';
import { schemeService, enrollmentService, beneficiaryService } from '../../services';
import { useToast } from '../../store/useToast';
import { Scheme, BeneficiaryProfile, Enrollment } from '../../types';
// Translation hook available if needed
// import { useTranslation } from '../../hooks/useTranslation';

export default function AshaSchemeManagement() {
    const navigate = useNavigate();
    // const { t } = useTranslation();
    const { addToast } = useToast();
    const {
        schemes: storeSchemes,
        beneficiaries: storeBeneficiaries,
        enrollments: storeEnrollments,
        fetchInitialData
    } = useStore();

    // Local state
    const [schemes, setSchemes] = useState<Scheme[]>([]);
    const [beneficiaries, setBeneficiaries] = useState<BeneficiaryProfile[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [search, setSearch] = useState('');
    const [enrollingId, setEnrollingId] = useState<string | null>(null);
    const [unenrollingId, setUnenrollingId] = useState<string | null>(null);

    // Fetch all data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [schemesData, beneficiariesData, enrollmentsData] = await Promise.all([
                    schemeService.getActive(),
                    beneficiaryService.list(),
                    enrollmentService.list()
                ]);
                setSchemes(schemesData);
                setBeneficiaries(beneficiariesData);
                setEnrollments(enrollmentsData);
            } catch (err) {
                console.error('Failed to load data:', err);
                // Fall back to store data
                setSchemes(storeSchemes);
                setBeneficiaries(storeBeneficiaries);
                setEnrollments(storeEnrollments);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [storeSchemes, storeBeneficiaries, storeEnrollments]);

    // Get enrollments for a scheme
    const getSchemeEnrollments = (schemeId: string) => {
        return enrollments.filter(e => e.schemeId === schemeId && e.status === 'active');
    };

    // Get beneficiary by ID
    const getBeneficiary = (beneficiaryId: string) => {
        return beneficiaries.find(b => b.id === beneficiaryId);
    };

    // Check if beneficiary is already enrolled in scheme
    const isEnrolled = (schemeId: string, beneficiaryId: string) => {
        return enrollments.some(
            e => e.schemeId === schemeId && e.beneficiaryId === beneficiaryId && e.status === 'active'
        );
    };

    // Check eligibility
    const checkEligibility = (scheme: Scheme, beneficiary: BeneficiaryProfile): boolean => {
        const audience = scheme.targetAudience || {};

        // Check user type
        if (audience.userTypes && audience.userTypes.length > 0) {
            if (!audience.userTypes.includes(beneficiary.userType)) return false;
        }

        // Check economic status
        if (audience.economicStatus && audience.economicStatus.length > 0) {
            if (!audience.economicStatus.includes(beneficiary.economicStatus || 'apl')) return false;
        }

        // Check risk level
        if (audience.riskLevel && audience.riskLevel.length > 0) {
            if (!audience.riskLevel.includes(beneficiary.riskLevel || 'low')) return false;
        }

        return true;
    };

    // Enroll beneficiary
    const handleEnroll = async (schemeId: string, beneficiaryId: string) => {
        setEnrollingId(beneficiaryId);
        try {
            const enrollment = await enrollmentService.enroll(schemeId, beneficiaryId);
            setEnrollments(prev => [...prev, enrollment]);
            addToast('Beneficiary enrolled successfully!', 'success');
            await fetchInitialData(true);
        } catch (err: any) {
            console.error('Enrollment failed:', err);
            addToast(err.response?.data?.detail || 'Enrollment failed', 'error');
        } finally {
            setEnrollingId(null);
        }
    };

    // Unenroll beneficiary
    const handleUnenroll = async (enrollmentId: string) => {
        setUnenrollingId(enrollmentId);
        try {
            await enrollmentService.delete(enrollmentId);
            setEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
            addToast('Beneficiary removed from scheme', 'success');
            await fetchInitialData(true);
        } catch (err: any) {
            console.error('Unenrollment failed:', err);
            addToast(err.response?.data?.detail || 'Failed to remove', 'error');
        } finally {
            setUnenrollingId(null);
        }
    };

    // Get eligible beneficiaries for a scheme (not already enrolled)
    const getEligibleBeneficiaries = (scheme: Scheme) => {
        return beneficiaries.filter(b => {
            if (isEnrolled(scheme.id, b.id)) return false;
            return checkEligibility(scheme, b);
        });
    };

    // Filter beneficiaries by search
    const filteredBeneficiaries = useMemo(() => {
        if (!selectedScheme) return [];
        const eligible = getEligibleBeneficiaries(selectedScheme);
        if (!search) return eligible;

        return eligible.filter(b =>
            b.name.toLowerCase().includes(search.toLowerCase()) ||
            b.id.toLowerCase().startsWith(search.toLowerCase())
        );
    }, [selectedScheme, beneficiaries, enrollments, search]);

    if (loading) {
        return (
            <RoleLayout role="asha_worker">
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                </div>
            </RoleLayout>
        );
    }

    return (
        <RoleLayout role="asha_worker">
            <div className="min-h-screen bg-slate-50 pb-24">
                {/* Header */}
                <div className="bg-white sticky top-0 z-10 border-b shadow-sm">
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full">
                                <ArrowLeft className="w-6 h-6 text-slate-600" />
                            </button>
                            <h1 className="font-bold text-lg text-slate-800">Scheme Management</h1>
                        </div>
                        <button
                            onClick={() => fetchInitialData(true)}
                            className="p-2 hover:bg-slate-100 rounded-full"
                        >
                            <RefreshCw className="w-5 h-5 text-slate-600" />
                        </button>
                    </div>
                </div>

                {/* Schemes Grid */}
                <div className="p-4 space-y-4">
                    <h2 className="font-bold text-slate-700 flex items-center gap-2">
                        <Award className="w-5 h-5 text-teal-600" />
                        Active Schemes ({schemes.length})
                    </h2>

                    {schemes.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                            <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-400">No active schemes available</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {schemes.map(scheme => {
                                const schemeEnrollments = getSchemeEnrollments(scheme.id);
                                const eligibleCount = getEligibleBeneficiaries(scheme).length;

                                return (
                                    <div
                                        key={scheme.id}
                                        className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start gap-4">
                                            {scheme.heroImage && (
                                                <img
                                                    src={scheme.heroImage}
                                                    alt=""
                                                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 truncate">
                                                            {scheme.title}
                                                        </h3>
                                                        <p className="text-sm text-slate-500 line-clamp-1">
                                                            {scheme.description}
                                                        </p>
                                                    </div>
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${scheme.category === 'financial'
                                                        ? 'bg-green-100 text-green-700'
                                                        : scheme.category === 'nutrition'
                                                            ? 'bg-orange-100 text-orange-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {scheme.category}
                                                    </span>
                                                </div>

                                                {/* Stats */}
                                                <div className="flex items-center gap-4 mt-3">
                                                    <div className="flex items-center gap-1.5 text-sm">
                                                        <Users className="w-4 h-4 text-teal-600" />
                                                        <span className="font-semibold text-slate-700">
                                                            {schemeEnrollments.length}
                                                        </span>
                                                        <span className="text-slate-400">enrolled</span>
                                                    </div>
                                                    {eligibleCount > 0 && (
                                                        <div className="flex items-center gap-1.5 text-sm text-amber-600">
                                                            <AlertCircle className="w-4 h-4" />
                                                            <span className="font-semibold">{eligibleCount}</span>
                                                            <span>eligible</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex gap-2 mt-3">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedScheme(scheme);
                                                            setShowEnrollModal(true);
                                                        }}
                                                        className="bg-teal-600 hover:bg-teal-700"
                                                    >
                                                        <Plus className="w-4 h-4 mr-1" />
                                                        Enroll
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setSelectedScheme(
                                                            selectedScheme?.id === scheme.id ? null : scheme
                                                        )}
                                                    >
                                                        <Users className="w-4 h-4 mr-1" />
                                                        View ({schemeEnrollments.length})
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Enrolled List (Expandable) */}
                                        <AnimatePresence>
                                            {selectedScheme?.id === scheme.id && !showEnrollModal && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                                        <h4 className="text-sm font-bold text-slate-600 mb-3">
                                                            Enrolled Beneficiaries
                                                        </h4>
                                                        {schemeEnrollments.length === 0 ? (
                                                            <p className="text-sm text-slate-400 italic">
                                                                No beneficiaries enrolled yet
                                                            </p>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {schemeEnrollments.map(enrollment => {
                                                                    const beneficiary = getBeneficiary(enrollment.beneficiaryId);
                                                                    if (!beneficiary) return null;

                                                                    return (
                                                                        <div
                                                                            key={enrollment.id}
                                                                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                                                                        >
                                                                            <div className="flex items-center gap-3">
                                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${beneficiary.riskLevel === 'high' ? 'bg-red-500' :
                                                                                    beneficiary.riskLevel === 'medium' ? 'bg-orange-500' :
                                                                                        'bg-green-500'
                                                                                    }`}>
                                                                                    {beneficiary.name.charAt(0)}
                                                                                </div>
                                                                                <div>
                                                                                    <p className="font-semibold text-slate-800 text-sm">
                                                                                        {beneficiary.name}
                                                                                    </p>
                                                                                    <p className="text-xs text-slate-500 capitalize">
                                                                                        {beneficiary.userType}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => handleUnenroll(enrollment.id)}
                                                                                disabled={unenrollingId === enrollment.id}
                                                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                                                            >
                                                                                {unenrollingId === enrollment.id ? (
                                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                                ) : (
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Enroll Modal */}
                <AnimatePresence>
                    {showEnrollModal && selectedScheme && (
                        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                                onClick={() => setShowEnrollModal(false)}
                            />
                            <motion.div
                                initial={{ y: 100, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 100, opacity: 0 }}
                                className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[80vh] overflow-hidden"
                            >
                                {/* Modal Header */}
                                <div className="p-4 border-b bg-teal-600 text-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-lg">Enroll in {selectedScheme.title}</h3>
                                            <p className="text-teal-100 text-sm">Select beneficiaries to enroll</p>
                                        </div>
                                        <button
                                            onClick={() => setShowEnrollModal(false)}
                                            className="p-2 hover:bg-white/10 rounded-full"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Search */}
                                    <div className="mt-3 relative">
                                        <Search className="absolute left-3 top-2.5 text-teal-200 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="Search beneficiaries..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-teal-200 focus:outline-none focus:ring-2 focus:ring-white/30"
                                        />
                                    </div>
                                </div>

                                {/* Beneficiary List */}
                                <div className="p-4 overflow-y-auto max-h-[50vh]">
                                    {filteredBeneficiaries.length === 0 ? (
                                        <div className="text-center py-8">
                                            <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                            <p className="text-slate-500">
                                                {search
                                                    ? 'No matching beneficiaries found'
                                                    : 'All eligible beneficiaries are already enrolled'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {filteredBeneficiaries.map(beneficiary => (
                                                <div
                                                    key={beneficiary.id}
                                                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${beneficiary.riskLevel === 'high' ? 'bg-red-500' :
                                                            beneficiary.riskLevel === 'medium' ? 'bg-orange-500' :
                                                                'bg-green-500'
                                                            }`}>
                                                            {beneficiary.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-800">
                                                                {beneficiary.name}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                <span className="capitalize">{beneficiary.userType}</span>
                                                                <span>•</span>
                                                                <span className="uppercase">{beneficiary.economicStatus || 'APL'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleEnroll(selectedScheme.id, beneficiary.id)}
                                                        disabled={enrollingId === beneficiary.id}
                                                        className="bg-teal-600 hover:bg-teal-700"
                                                    >
                                                        {enrollingId === beneficiary.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Plus className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Quick Stats */}
                                <div className="p-4 border-t bg-slate-50 flex justify-between text-sm">
                                    <span className="text-slate-500">
                                        {filteredBeneficiaries.length} eligible beneficiaries
                                    </span>
                                    <span className="text-teal-600 font-semibold">
                                        {getSchemeEnrollments(selectedScheme.id).length} enrolled
                                    </span>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </RoleLayout>
    );
}
