// Logic for Early Risk Identification and Referral Guidance

export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high';
  referral: string | null;
  flags: string[];
  summary: string;
}

export const assessRisk = (
  bpSystolic: number, 
  bpDiastolic: number, 
  symptoms: string[],
  pregnancyStage: string
): RiskAssessment => {
  const flags: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  let referral = null;

  // 1. Blood Pressure Checks
  if (bpSystolic >= 160 || bpDiastolic >= 110) {
    flags.push('Severe Hypertension (High BP)');
    riskLevel = 'high';
    referral = 'District Hospital (Immediate)';
  } else if (bpSystolic >= 140 || bpDiastolic >= 90) {
    flags.push('Hypertension');
    if (riskLevel !== 'high') {
      riskLevel = 'medium';
      referral = 'PHC (Primary Health Centre)';
    }
  }

  // 2. Symptom Analysis
  const dangerSigns = ['bleeding', 'convulsions', 'severe pain', 'blurred vision', 'water break'];
  const warningSigns = ['fever', 'swelling', 'fatigue', 'pallor', 'vomiting', 'headache'];

  const foundDangerSigns = symptoms.filter(s => dangerSigns.some(ds => s.toLowerCase().includes(ds)));
  const foundWarningSigns = symptoms.filter(s => warningSigns.some(ws => s.toLowerCase().includes(ws)));

  if (foundDangerSigns.length > 0) {
    flags.push(...foundDangerSigns.map(s => `Danger Sign: ${s}`));
    riskLevel = 'high';
    referral = 'CHC/District Hospital (Emergency)';
  } else if (foundWarningSigns.length > 0) {
    flags.push(...foundWarningSigns.map(s => `Warning: ${s}`));
    if (riskLevel === 'low') {
      riskLevel = 'medium';
      referral = 'ANM / PHC Checkup';
    }
  }

  // 3. Generate Auto-Summary
  const summary = `Patient is at ${riskLevel.toUpperCase()} risk. ${flags.length > 0 ? 'Flags: ' + flags.join(', ') + '.' : 'Vitals are stable.'} ${referral ? 'Referral suggested to ' + referral + '.' : 'Routine follow-up advised.'}`;

  return { riskLevel, referral, flags, summary };
};
