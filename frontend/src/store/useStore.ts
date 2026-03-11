import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, BeneficiaryProfile, HealthLog, Alert, Scheme, Enrollment, DailyLog, SyncQueueItem, Language, Child } from '../types';
import { v4 as uuidv4 } from 'uuid';
import {
  authService,
  beneficiaryService,
  dailyLogService,
  healthLogService,
  alertService,
  childService,
  schemeService,
  enrollmentService
} from '../services';

interface AppState {
  theme: 'light' | 'dark';
  language: Language;
  isLoading: boolean;
  isFetching: boolean;
  isHydrated: boolean;
  isOnline: boolean;
  isSyncing: boolean;
  currentUser: User | null;

  // Data
  users: User[];
  beneficiaries: BeneficiaryProfile[];
  children: Child[];
  healthLogs: HealthLog[];
  dailyLogs: DailyLog[];
  alerts: Alert[];
  schemes: Scheme[];
  enrollments: Enrollment[];

  // Offline Queue
  syncQueue: SyncQueueItem[];

  // Actions
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  setOnlineStatus: (status: boolean) => void;
  fetchInitialData: (force?: boolean) => Promise<void>;
  processSyncQueue: () => Promise<void>;

  login: (user: User) => void;
  logout: () => Promise<void>;
  resetSession: () => void;

  // Data Operations
  ensureBeneficiaryProfile: (userId: string, name: string) => Promise<void>;
  updateBeneficiaryProfile: (id: string, updates: Partial<BeneficiaryProfile>) => Promise<void>;
  deleteBeneficiary: (id: string) => Promise<void>;
  addChild: (child: Omit<Child, 'id'>) => Promise<void>;
  updateChild: (id: string, updates: Partial<Child>) => Promise<void>;
  addHealthLog: (log: Omit<HealthLog, 'id'>) => Promise<void>;
  addDailyLog: (log: Omit<DailyLog, 'id'>) => Promise<void>;
  updateDailyLog: (log: DailyLog) => void;
  triggerSOS: (beneficiaryId: string) => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
  addIncomingAlert: (alert: Alert) => void;

  // Scheme Actions
  addScheme: (scheme: Omit<Scheme, 'id' | 'enrolledCount'>) => Promise<void>;
  updateScheme: (id: string, updates: Partial<Scheme>) => Promise<void>;
  deleteScheme: (id: string) => Promise<void>;
  enrollBeneficiary: (schemeId: string, beneficiaryId: string, enrolledBy: string) => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      language: 'en',
      isLoading: false,
      isFetching: false,
      isHydrated: false,
      isOnline: navigator.onLine,
      isSyncing: false,
      currentUser: null,
      users: [],
      beneficiaries: [],
      children: [],
      healthLogs: [],
      dailyLogs: [],
      alerts: [],
      schemes: [],
      enrollments: [],
      syncQueue: [],

      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: newTheme });
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      setLanguage: (lang) => set({ language: lang }),

      setOnlineStatus: (status) => set({ isOnline: status }),

      fetchInitialData: async (force = false) => {
        const state = get();
        if (state.isFetching && !force) return;

        set({ isFetching: true, isLoading: true });

        try {
          // 1. Check if authenticated and get current user
          if (authService.isAuthenticated() && navigator.onLine) {
            const user = await authService.getCurrentUser();
            if (user) {
              set({ currentUser: user as User });
            }
          }

          if (!navigator.onLine) {
            set({ isLoading: false, isFetching: false });
            return;
          }

          // 2. Fetch Data with Promise.allSettled to prevent total failure
          const results = await Promise.allSettled([
            beneficiaryService.list(),
            childService.list(),
            schemeService.list(),
            enrollmentService.list(),
            dailyLogService.list(),
            healthLogService.list(),
            alertService.list(),
          ]);

          const [
            beneficiariesRes,
            childrenRes,
            schemesRes,
            enrollmentsRes,
            dailyLogsRes,
            healthLogsRes,
            alertsRes
          ] = results;

          // Helper to extract data or empty array
          const getData = <T>(res: PromiseSettledResult<T[]>): T[] =>
            res.status === 'fulfilled' ? res.value : [];

          set({
            beneficiaries: getData(beneficiariesRes),
            children: getData(childrenRes),
            schemes: getData(schemesRes),
            enrollments: getData(enrollmentsRes),
            dailyLogs: getData(dailyLogsRes),
            healthLogs: getData(healthLogsRes),
            alerts: getData(alertsRes),
          });

        } catch (error) {
          console.error('Error fetching initial data:', error);
        } finally {
          set({ isLoading: false, isFetching: false });
        }
      },

      processSyncQueue: async () => {
        const { syncQueue, isOnline } = get();
        if (!isOnline || syncQueue.length === 0) return;

        set({ isSyncing: true });
        const queue = [...syncQueue];
        const remainingQueue: SyncQueueItem[] = [];

        for (const item of queue) {
          try {
            switch (item.type) {
              case 'ADD_DAILY_LOG':
                await dailyLogService.create({
                  date: item.payload.date,
                  mood: item.payload.mood,
                  symptoms: item.payload.symptoms,
                  notes: item.payload.notes
                });
                break;

              case 'ADD_HEALTH_LOG':
                await healthLogService.create({
                  beneficiaryId: item.payload.beneficiaryId,
                  date: item.payload.date,
                  bpSystolic: item.payload.bpSystolic,
                  bpDiastolic: item.payload.bpDiastolic,
                  symptoms: item.payload.symptoms,
                  mood: item.payload.mood,
                  isEmergency: item.payload.isEmergency
                });
                break;

              case 'TRIGGER_SOS':
                await alertService.triggerSOS(item.payload.beneficiaryId);
                break;

              case 'ENROLL_SCHEME':
                await enrollmentService.enroll(item.payload.schemeId, item.payload.beneficiaryId);
                break;

              case 'UPDATE_PROFILE':
                await beneficiaryService.update(item.payload.id, item.payload.updates);
                break;

              case 'ADD_CHILD':
                await childService.create(item.payload);
                break;

              case 'ADD_SCHEME':
                await schemeService.create(item.payload);
                break;

              case 'UPDATE_SCHEME':
                await schemeService.update(item.payload.schemeId, item.payload.schemeUpdates);
                break;
            }

          } catch (err: any) {
            console.error(`Failed to sync item ${item.id}:`, err);
            // Check for duplicate error (skip) or network error (retry)
            if (err?.response?.status === 409) continue; // Already exists

            const isNetworkError = !err.response;
            if (isNetworkError || item.retryCount < 5) {
              remainingQueue.push({ ...item, retryCount: item.retryCount + 1 });
            }
          }
        }

        set({ syncQueue: remainingQueue, isSyncing: false });
        if (remainingQueue.length < queue.length) {
          get().fetchInitialData(true); // Force refresh after sync
        }
      },

      login: (user) => {
        set({ currentUser: user });
      },

      logout: async () => {
        try {
          authService.logout();
          set({
            currentUser: null,
            isLoading: false,
            beneficiaries: [],
            healthLogs: [],
            dailyLogs: [],
            alerts: [],
            enrollments: [],
            children: []
          });
        } catch (error) {
          console.error("Logout error:", error);
        }
      },

      resetSession: () => {
        set({
          currentUser: null,
          isLoading: false,
          beneficiaries: [],
          healthLogs: [],
          dailyLogs: [],
          alerts: [],
          enrollments: [],
          children: []
        });
      },

      ensureBeneficiaryProfile: async (userId, name) => {
        const state = get();
        const exists = state.beneficiaries.find(b => b.userId === userId);
        if (!exists) {
          try {
            // Check if profile exists via API
            const existingProfile = await beneficiaryService.getMyProfile();

            if (existingProfile) {
              set(state => ({
                beneficiaries: [...state.beneficiaries, existingProfile]
              }));
              return;
            }

            // Create new profile
            const newProfile = await beneficiaryService.create({
              name: name,
              risk_level: 'low',
              user_type: 'girl'
            });

            set(state => ({
              beneficiaries: [...state.beneficiaries, newProfile]
            }));
          } catch (err: any) {
            // Handle 409 Conflict (profile already exists) gracefully
            if (err.response?.status === 409) {
              const existingProfile = await beneficiaryService.getMyProfile();
              if (existingProfile) {
                set(state => ({
                  beneficiaries: [...state.beneficiaries, existingProfile]
                }));
              }
              return;
            }
            console.error('Error creating profile:', err);
          }
        }
      },

      updateBeneficiaryProfile: async (id, updates) => {
        set((state) => ({
          beneficiaries: state.beneficiaries.map(b => b.id === id ? { ...b, ...updates } : b)
        }));

        try {
          await beneficiaryService.update(id, updates);
        } catch (err) {
          set(state => ({
            syncQueue: [...state.syncQueue, {
              id: uuidv4(),
              type: 'UPDATE_PROFILE',
              payload: { id, updates },
              timestamp: Date.now(),
              retryCount: 0
            }]
          }));
        }
      },

      deleteBeneficiary: async (id) => {
        set((state) => ({
          beneficiaries: state.beneficiaries.filter(b => b.id !== id),
          children: state.children.filter(c => c.beneficiaryId !== id),
          healthLogs: state.healthLogs.filter(l => l.beneficiaryId !== id),
          alerts: state.alerts.filter(a => a.beneficiaryId !== id),
          enrollments: state.enrollments.filter(e => e.beneficiaryId !== id)
        }));

        try {
          await beneficiaryService.delete(id);
        } catch (err) {
          console.error("Failed to delete beneficiary:", err);
        }
      },

      addChild: async (child) => {
        const newChild = { ...child, id: uuidv4() };
        set(state => ({ children: [...state.children, newChild] }));

        try {
          await childService.create(child);
        } catch (err) {
          set(state => ({
            syncQueue: [...state.syncQueue, {
              id: uuidv4(),
              type: 'ADD_CHILD',
              payload: newChild,
              timestamp: Date.now(),
              retryCount: 0
            }]
          }));
        }
      },

      updateChild: async (id, updates) => {
        set((state) => ({
          children: state.children.map(c => c.id === id ? { ...c, ...updates } : c)
        }));

        try {
          await childService.update(id, updates);
        } catch (err) {
          console.error("Failed to update child:", err);
        }
      },

      addHealthLog: async (log) => {
        const newLog = { ...log, id: uuidv4() };
        set((state) => ({ healthLogs: [...state.healthLogs, newLog] }));

        try {
          await healthLogService.create(log);
        } catch (err) {
          set(state => ({
            syncQueue: [...state.syncQueue, {
              id: uuidv4(),
              type: 'ADD_HEALTH_LOG',
              payload: newLog,
              timestamp: Date.now(),
              retryCount: 0
            }]
          }));
        }
      },

      addDailyLog: async (log) => {
        const newLog = { ...log, id: uuidv4() };
        set((state) => {
          const filtered = state.dailyLogs.filter(l => l.date !== log.date || l.userId !== log.userId);
          return { dailyLogs: [...filtered, newLog] };
        });

        try {
          await dailyLogService.create({
            date: log.date,
            mood: log.mood,
            symptoms: log.symptoms,
            notes: log.notes
          });
        } catch (err) {
          set(state => ({
            syncQueue: [...state.syncQueue, {
              id: uuidv4(),
              type: 'ADD_DAILY_LOG',
              payload: newLog,
              timestamp: Date.now(),
              retryCount: 0
            }]
          }));
        }
      },

      updateDailyLog: (log) => set((state) => ({
        dailyLogs: state.dailyLogs.map(l => l.id === log.id ? log : l)
      })),

      triggerSOS: async (beneficiaryId) => {
        const newAlert: Alert = {
          id: uuidv4(),
          beneficiaryId,
          severity: 'critical',
          status: 'open',
          timestamp: new Date().toISOString(),
          type: 'sos'
        };
        set((state) => ({ alerts: [newAlert, ...state.alerts] }));

        try {
          await alertService.triggerSOS(beneficiaryId);
        } catch (err) {
          set(state => ({
            syncQueue: [...state.syncQueue, {
              id: uuidv4(),
              type: 'TRIGGER_SOS',
              payload: { id: newAlert.id, beneficiaryId },
              timestamp: Date.now(),
              retryCount: 0
            }]
          }));
        }
      },

      resolveAlert: async (alertId) => {
        set((state) => ({
          alerts: state.alerts.map(a => a.id === alertId ? { ...a, status: 'resolved' } : a)
        }));
        await alertService.resolve(alertId);
      },

      addIncomingAlert: (alert) => {
        set((state) => {
          if (state.alerts.some(a => a.id === alert.id)) return state;
          return { alerts: [alert, ...state.alerts] };
        });
      },

      addScheme: async (scheme) => {
        const newScheme = { ...scheme, id: uuidv4(), enrolledCount: 0 };
        set((state) => ({ schemes: [...state.schemes, newScheme] }));

        try {
          await schemeService.create(scheme);
        } catch (err) {
          set(state => ({
            syncQueue: [...state.syncQueue, {
              id: uuidv4(),
              type: 'ADD_SCHEME',
              payload: newScheme,
              timestamp: Date.now(),
              retryCount: 0
            }]
          }));
        }
      },

      updateScheme: async (id, updates) => {
        set((state) => ({
          schemes: state.schemes.map(s => s.id === id ? { ...s, ...updates } : s)
        }));

        try {
          await schemeService.update(id, updates);
        } catch (err) {
          set(state => ({
            syncQueue: [...state.syncQueue, {
              id: uuidv4(),
              type: 'UPDATE_SCHEME',
              payload: { schemeId: id, schemeUpdates: updates },
              timestamp: Date.now(),
              retryCount: 0
            }]
          }));
        }
      },

      deleteScheme: async (id) => {
        set((state) => ({ schemes: state.schemes.filter(s => s.id !== id) }));
        await schemeService.delete(id);
      },

      enrollBeneficiary: async (schemeId, beneficiaryId, enrolledBy) => {
        const state = get();
        const exists = state.enrollments.some(e => e.schemeId === schemeId && e.beneficiaryId === beneficiaryId);
        if (exists) return;

        const newEnrollment: Enrollment = {
          id: uuidv4(),
          schemeId,
          beneficiaryId,
          status: 'active',
          enrolledBy,
          date: new Date().toISOString()
        };

        set((state) => ({
          schemes: state.schemes.map(s =>
            s.id === schemeId ? { ...s, enrolledCount: s.enrolledCount + 1 } : s
          ),
          enrollments: [...state.enrollments, newEnrollment]
        }));

        try {
          await enrollmentService.enroll(schemeId, beneficiaryId);
        } catch (err) {
          set(state => ({
            syncQueue: [...state.syncQueue, {
              id: uuidv4(),
              type: 'ENROLL_SCHEME',
              payload: newEnrollment,
              timestamp: Date.now(),
              retryCount: 0
            }]
          }));
        }
      },
    }),
    {
      name: 'asha-ai-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true;
        }
        if (state?.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }
  )
);
