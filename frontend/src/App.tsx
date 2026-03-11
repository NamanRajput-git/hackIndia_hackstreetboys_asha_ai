import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { authService } from './services';
import { ToastContainer } from './components/ui/ToastContainer';
import NetworkStatus from './components/ui/NetworkStatus';
import { useToast } from './store/useToast';

import Landing from './pages/Landing';
import RoleSelection from './pages/auth/RoleSelection';
import Login from './pages/auth/Login';

// Beneficiary Pages
import BeneficiaryDashboard from './pages/beneficiary/Dashboard';
import BeneficiarySchemes from './pages/beneficiary/Schemes';
import BeneficiaryNutrition from './pages/beneficiary/Nutrition';
import BeneficiaryEducation from './pages/beneficiary/Education';
import BeneficiaryCard from './pages/beneficiary/DigitalCardPage';
import CycleTrackerScreen from './pages/beneficiary/CycleTracker';

// ASHA Pages
import AshaDashboard from './pages/asha/Dashboard';
import VisitForm from './pages/asha/VisitForm';
import VisitScheduler from './pages/asha/VisitScheduler';
import QRScanner from './pages/asha/QRScanner';
import PatientProfile from './pages/asha/PatientProfile';
import PatientList from './pages/asha/PatientList';
import AshaAlerts from './pages/asha/Alerts';
import AshaSchemeManagement from './pages/asha/SchemeManagement';

// Partner Pages
import PartnerDashboard from './pages/partner/Dashboard';
import SchemesList from './pages/partner/SchemesList';
import CreateScheme from './pages/partner/CreateScheme';
import SchemeDetails from './pages/partner/SchemeDetails';

function App() {
  const {
    fetchInitialData,
    resetSession,
    setOnlineStatus,
    processSyncQueue,
    currentUser
  } = useStore();
  const { addToast } = useToast();

  useEffect(() => {
    // 1. Check authentication and fetch initial data
    const initApp = async () => {
      if (authService.isAuthenticated()) {
        await fetchInitialData();
      }
    };

    initApp();

    // 2. Set up polling for alerts (since we don't have WebSocket)
    // In production, you'd want to implement WebSocket or SSE
    const alertsInterval = setInterval(async () => {
      if (authService.isAuthenticated() && currentUser?.role === 'asha_worker') {
        try {
          // Fetch latest alerts - store will handle deduplication
          await fetchInitialData();
        } catch (error) {
          console.error('Error fetching alerts:', error);
        }
      }
    }, 30000); // Poll every 30 seconds

    // 3. Network Listeners
    const handleOnline = () => {
      setOnlineStatus(true);
      processSyncQueue();
      fetchInitialData(true); // Refresh data when back online
      addToast('Back online! Syncing data...', 'success');
    };
    const handleOffline = () => {
      setOnlineStatus(false);
      addToast('You are offline. Changes will sync when reconnected.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(alertsInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentUser?.role]); // Re-run when role changes

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <NetworkStatus />
        <ToastContainer />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/role-select" element={<RoleSelection />} />
          <Route path="/login" element={<Login />} />

          {/* Beneficiary Routes */}
          <Route path="/beneficiary" element={<BeneficiaryDashboard />} />
          <Route path="/beneficiary/schemes" element={<BeneficiarySchemes />} />
          <Route path="/beneficiary/nutrition" element={<BeneficiaryNutrition />} />
          <Route path="/beneficiary/education" element={<BeneficiaryEducation />} />
          <Route path="/beneficiary/card" element={<BeneficiaryCard />} />
          <Route path="/beneficiary/tracker" element={<CycleTrackerScreen />} />

          {/* ASHA Routes */}
          <Route path="/asha" element={<AshaDashboard />} />
          <Route path="/asha/visit" element={<VisitForm />} />
          <Route path="/asha/visit/:id" element={<VisitForm />} />
          <Route path="/asha/scheduler" element={<VisitScheduler />} />
          <Route path="/asha/scan" element={<QRScanner />} />
          <Route path="/asha/patients" element={<PatientList />} />
          <Route path="/asha/alerts" element={<AshaAlerts />} />
          <Route path="/asha/schemes" element={<AshaSchemeManagement />} />
          <Route path="/asha/patient/:id" element={<PatientProfile />} />

          {/* Partner Routes */}
          <Route path="/partner" element={<PartnerDashboard />} />
          <Route path="/partner/schemes" element={<SchemesList />} />
          <Route path="/partner/schemes/create" element={<CreateScheme />} />
          <Route path="/partner/schemes/edit/:id" element={<CreateScheme />} />
          <Route path="/partner/schemes/:id" element={<SchemeDetails />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
