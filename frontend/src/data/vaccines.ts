export interface Vaccine {
  id: string;
  name: string;
  dueWeek: number; // Weeks from birth
  description: string;
}

export const VACCINE_SCHEDULE: Vaccine[] = [
  { id: 'bcg', name: 'BCG', dueWeek: 0, description: 'At Birth' },
  { id: 'opv_0', name: 'OPV 0', dueWeek: 0, description: 'At Birth' },
  { id: 'hep_b', name: 'Hepatitis B', dueWeek: 0, description: 'At Birth' },
  { id: 'opv_1', name: 'OPV 1', dueWeek: 6, description: '6 Weeks' },
  { id: 'penta_1', name: 'Pentavalent 1', dueWeek: 6, description: '6 Weeks' },
  { id: 'rota_1', name: 'Rotavirus 1', dueWeek: 6, description: '6 Weeks' },
  { id: 'opv_2', name: 'OPV 2', dueWeek: 10, description: '10 Weeks' },
  { id: 'penta_2', name: 'Pentavalent 2', dueWeek: 10, description: '10 Weeks' },
  { id: 'opv_3', name: 'OPV 3', dueWeek: 14, description: '14 Weeks' },
  { id: 'penta_3', name: 'Pentavalent 3', dueWeek: 14, description: '14 Weeks' },
  { id: 'measles_1', name: 'Measles / MR 1', dueWeek: 36, description: '9 Months' },
  { id: 'je_1', name: 'JE 1', dueWeek: 36, description: '9 Months' },
  { id: 'vit_a_1', name: 'Vitamin A (Dose 1)', dueWeek: 36, description: '9 Months' },
  { id: 'opv_booster', name: 'OPV Booster', dueWeek: 72, description: '16-24 Months' },
  { id: 'measles_2', name: 'Measles / MR 2', dueWeek: 72, description: '16-24 Months' },
  { id: 'dpt_booster_1', name: 'DPT Booster 1', dueWeek: 72, description: '16-24 Months' },
];
