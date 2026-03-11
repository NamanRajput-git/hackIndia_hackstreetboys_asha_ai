import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    Clock,
    MapPin,
    Plus,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    XCircle,
    User,
    Baby,
    UserPlus,
    Flower2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { RoleLayout } from '../../components/layout/RoleLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { useStore } from '../../store/useStore';
import { visitService, Visit, VisitStatus, VisitPriority, beneficiaryService } from '../../services';
import { BeneficiaryProfile } from '../../types';

export default function VisitScheduler() {
    const navigate = useNavigate();
    const { beneficiaries: storeBeneficiaries, fetchInitialData } = useStore();

    const [visits, setVisits] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'today' | 'overdue' | 'scheduled'>('today');
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [todayCount, setTodayCount] = useState(0);
    const [overdueCount, setOverdueCount] = useState(0);
    const [localBeneficiaries, setLocalBeneficiaries] = useState<BeneficiaryProfile[]>([]);
    const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(false);

    // Form state for new visit
    const [newVisit, setNewVisit] = useState({
        beneficiary_id: '',
        scheduled_date: format(new Date(), 'yyyy-MM-dd'),
        scheduled_time: '10:00',
        visit_type: 'routine_checkup',
        purpose: '',
        priority: 'normal' as VisitPriority
    });

    // Fetch beneficiaries when modal opens or when store is empty
    useEffect(() => {
        const loadBeneficiaries = async () => {
            // If we have store data, use it first
            if (storeBeneficiaries.length > 0) {
                setLocalBeneficiaries(storeBeneficiaries);
            }

            // If store is empty OR we are opening the modal, ensure we have fresh data
            if (storeBeneficiaries.length === 0 || showScheduleModal) {
                setLoadingBeneficiaries(true);
                try {
                    const data = await beneficiaryService.list();
                    setLocalBeneficiaries(data);

                    // Update store if empty
                    if (storeBeneficiaries.length === 0) {
                        fetchInitialData(true);
                    }
                } catch (error) {
                    console.error('Error loading beneficiaries:', error);
                } finally {
                    setLoadingBeneficiaries(false);
                }
            }
        };

        loadBeneficiaries();
    }, [storeBeneficiaries.length, showScheduleModal, fetchInitialData]);

    useEffect(() => {
        loadVisits();
    }, [filter]);

    const loadVisits = async () => {
        setLoading(true);
        try {
            if (filter === 'today') {
                const todayVisits = await visitService.getToday();
                setVisits(todayVisits);
            } else if (filter === 'overdue') {
                const overdueVisits = await visitService.getOverdue();
                setVisits(overdueVisits);
            } else {
                const response = await visitService.list({
                    status: filter === 'scheduled' ? 'scheduled' : undefined
                });
                setVisits(response.visits);
                setTodayCount(response.todayCount);
                setOverdueCount(response.overdueCount);
            }
        } catch (error) {
            console.error('Error loading visits:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleScheduleVisit = async () => {
        if (!newVisit.beneficiary_id || !newVisit.scheduled_date) return;

        try {
            await visitService.create(newVisit);
            setShowScheduleModal(false);
            setNewVisit({
                beneficiary_id: '',
                scheduled_date: format(new Date(), 'yyyy-MM-dd'),
                scheduled_time: '10:00',
                visit_type: 'routine_checkup',
                purpose: '',
                priority: 'normal'
            });
            loadVisits();
        } catch (error) {
            console.error('Error scheduling visit:', error);
        }
    };

    const handleCompleteVisit = async (visitId: string) => {
        try {
            await visitService.complete(visitId);
            loadVisits();
        } catch (error) {
            console.error('Error completing visit:', error);
        }
    };

    const handleCancelVisit = async (visitId: string) => {
        try {
            await visitService.cancel(visitId);
            loadVisits();
        } catch (error) {
            console.error('Error cancelling visit:', error);
        }
    };

    const getPatientIcon = (type?: string) => {
        switch (type) {
            case 'mother': return <Baby size={18} />;
            case 'pregnant': return <UserPlus size={18} />;
            case 'girl': return <Flower2 size={18} />;
            default: return <User size={18} />;
        }
    };

    const getStatusColor = (status: VisitStatus) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-100 text-blue-700';
            case 'completed': return 'bg-green-100 text-green-700';
            case 'cancelled': return 'bg-gray-100 text-gray-700';
            case 'missed': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getPriorityColor = (priority: VisitPriority) => {
        switch (priority) {
            case 'urgent': return 'bg-red-500';
            case 'high': return 'bg-orange-500';
            case 'normal': return 'bg-blue-500';
            case 'low': return 'bg-gray-400';
            default: return 'bg-blue-500';
        }
    };

    const visitTypes = [
        { value: 'routine_checkup', label: 'Routine Checkup' },
        { value: 'anc_visit', label: 'ANC Visit' },
        { value: 'pnc_visit', label: 'PNC Visit' },
        { value: 'immunization', label: 'Immunization' },
        { value: 'counseling', label: 'Counseling' },
        { value: 'emergency', label: 'Emergency' },
    ];

    return (
        <RoleLayout role="asha_worker" title="Visit Scheduler">
            <div className="space-y-6 pb-24">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div
                        onClick={() => setFilter('today')}
                        className={`p-5 rounded-2xl cursor-pointer transition-all ${filter === 'today' ? 'bg-teal-500 text-white shadow-lg scale-[1.02]' : 'bg-teal-100 text-teal-800'
                            }`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar size={24} />
                            <span className="text-3xl font-black">{todayCount}</span>
                        </div>
                        <p className="font-bold">Today's Visits</p>
                    </div>

                    <div
                        onClick={() => setFilter('overdue')}
                        className={`p-5 rounded-2xl cursor-pointer transition-all ${filter === 'overdue' ? 'bg-red-500 text-white shadow-lg scale-[1.02]' : 'bg-red-100 text-red-800'
                            }`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <AlertCircle size={24} />
                            <span className="text-3xl font-black">{overdueCount}</span>
                        </div>
                        <p className="font-bold">Overdue</p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {(['today', 'scheduled', 'overdue', 'all'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${filter === f
                                ? 'bg-slate-800 text-white'
                                : 'bg-white text-slate-600 border border-slate-200'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Visits List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : visits.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
                            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">No visits found</p>
                            <p className="text-slate-400 text-sm mt-1">Schedule a new visit to get started</p>
                        </div>
                    ) : (
                        visits.map((visit) => (
                            <motion.div
                                key={visit.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <GlassCard className="p-5">
                                    <div className="flex items-start gap-4">
                                        {/* Priority indicator */}
                                        <div className={`w-1.5 h-full min-h-[80px] rounded-full ${getPriorityColor(visit.priority)}`} />

                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${visit.beneficiaryRiskLevel === 'high' ? 'bg-red-500' :
                                                            visit.beneficiaryRiskLevel === 'medium' ? 'bg-orange-500' : 'bg-teal-500'
                                                            }`}>
                                                            {getPatientIcon(visit.beneficiaryUserType)}
                                                        </div>
                                                        <h3 className="font-bold text-slate-800 text-lg">
                                                            {visit.beneficiaryName || 'Unknown'}
                                                        </h3>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar size={14} />
                                                            {format(parseISO(visit.scheduledDate), 'dd MMM yyyy')}
                                                        </span>
                                                        {visit.scheduledTime && (
                                                            <span className="flex items-center gap-1">
                                                                <Clock size={14} />
                                                                {visit.scheduledTime}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(visit.status)}`}>
                                                    {visit.status}
                                                </span>
                                            </div>

                                            {visit.beneficiaryAddress && (
                                                <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                                                    <MapPin size={14} />
                                                    <span>{visit.beneficiaryAddress}</span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600">
                                                    {visitTypes.find(t => t.value === visit.visitType)?.label || visit.visitType}
                                                </span>
                                                {visit.purpose && (
                                                    <span className="text-sm text-slate-500 truncate">• {visit.purpose}</span>
                                                )}
                                            </div>

                                            {visit.status === 'scheduled' && (
                                                <div className="flex gap-2 pt-2 border-t border-slate-100">
                                                    <Button
                                                        size="sm"
                                                        className="flex-1 bg-teal-500 hover:bg-teal-600"
                                                        onClick={() => {
                                                            navigate(`/asha/visit/${visit.id}?patientId=${visit.beneficiaryId}`);
                                                        }}
                                                    >
                                                        Start Visit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleCompleteVisit(visit.id)}
                                                    >
                                                        <CheckCircle2 size={16} />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-500 border-red-200 hover:bg-red-50"
                                                        onClick={() => handleCancelVisit(visit.id)}
                                                    >
                                                        <XCircle size={16} />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        <ChevronRight className="text-slate-300 shrink-0" />
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* FAB to Schedule New Visit */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowScheduleModal(true)}
                className="fixed bottom-24 right-6 w-14 h-14 bg-teal-600 text-white rounded-full shadow-xl flex items-center justify-center z-40"
            >
                <Plus size={28} />
            </motion.button>

            {/* Schedule Modal */}
            <AnimatePresence>
                {showScheduleModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-end"
                        onClick={() => setShowScheduleModal(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
                        >
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />

                            <h2 className="text-2xl font-black text-slate-800 mb-6">Schedule Visit</h2>

                            <div className="space-y-5">
                                {/* Patient Selection */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 mb-2">
                                        Select Patient *
                                    </label>
                                    <select
                                        className="w-full p-4 bg-slate-50 rounded-xl border-none font-medium text-slate-800"
                                        value={newVisit.beneficiary_id}
                                        onChange={(e) => setNewVisit({ ...newVisit, beneficiary_id: e.target.value })}
                                        disabled={loadingBeneficiaries}
                                    >
                                        <option value="">
                                            {loadingBeneficiaries
                                                ? 'Loading patients...'
                                                : localBeneficiaries.length === 0
                                                    ? 'No patients found'
                                                    : '-- Choose Patient --'}
                                        </option>
                                        {localBeneficiaries.map(b => (
                                            <option key={b.id} value={b.id}>
                                                {b.name} ({b.userType}) {b.riskLevel === 'high' ? '⚠️' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {localBeneficiaries.length === 0 && !loadingBeneficiaries && (
                                        <p className="text-xs text-amber-600 mt-1">
                                            No patients registered. Add beneficiaries first.
                                        </p>
                                    )}
                                </div>

                                {/* Date & Time */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-500 mb-2">
                                            Date *
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full p-4 bg-slate-50 rounded-xl border-none font-medium text-slate-800"
                                            value={newVisit.scheduled_date}
                                            onChange={(e) => setNewVisit({ ...newVisit, scheduled_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-500 mb-2">
                                            Time
                                        </label>
                                        <input
                                            type="time"
                                            className="w-full p-4 bg-slate-50 rounded-xl border-none font-medium text-slate-800"
                                            value={newVisit.scheduled_time}
                                            onChange={(e) => setNewVisit({ ...newVisit, scheduled_time: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Visit Type */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 mb-2">
                                        Visit Type
                                    </label>
                                    <select
                                        className="w-full p-4 bg-slate-50 rounded-xl border-none font-medium text-slate-800"
                                        value={newVisit.visit_type}
                                        onChange={(e) => setNewVisit({ ...newVisit, visit_type: e.target.value })}
                                    >
                                        {visitTypes.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Priority */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 mb-2">
                                        Priority
                                    </label>
                                    <div className="flex gap-2">
                                        {(['low', 'normal', 'high', 'urgent'] as VisitPriority[]).map((p) => (
                                            <button
                                                key={p}
                                                onClick={() => setNewVisit({ ...newVisit, priority: p })}
                                                className={`flex-1 py-3 rounded-xl font-bold capitalize transition-all ${newVisit.priority === p
                                                    ? `${getPriorityColor(p)} text-white`
                                                    : 'bg-slate-100 text-slate-600'
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Purpose */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-500 mb-2">
                                        Purpose / Notes
                                    </label>
                                    <textarea
                                        className="w-full p-4 bg-slate-50 rounded-xl border-none font-medium text-slate-800 resize-none"
                                        rows={3}
                                        placeholder="e.g., Monthly ANC checkup, vaccination reminder..."
                                        value={newVisit.purpose}
                                        onChange={(e) => setNewVisit({ ...newVisit, purpose: e.target.value })}
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setShowScheduleModal(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="flex-1 bg-teal-600 hover:bg-teal-700"
                                        onClick={handleScheduleVisit}
                                        disabled={!newVisit.beneficiary_id || !newVisit.scheduled_date}
                                    >
                                        Schedule Visit
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </RoleLayout>
    );
}
