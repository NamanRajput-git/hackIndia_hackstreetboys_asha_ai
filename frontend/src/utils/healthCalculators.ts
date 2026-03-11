import { addDays, format, differenceInDays, isAfter } from 'date-fns';

export const calculateCycleInsights = (lastPeriodDate: string) => {
  const lmp = new Date(lastPeriodDate);
  
  // Safety check for invalid dates
  if (isNaN(lmp.getTime())) {
    return {
      nextPeriod: 'N/A',
      daysToNextPeriod: 0,
      fertileWindow: 'N/A',
      isFertile: false,
      edd: 'N/A',
      pregnancyWeek: 0
    };
  }

  const today = new Date();
  
  // Standard 28-day cycle assumptions
  const nextPeriod = addDays(lmp, 28);
  const fertileWindowStart = addDays(lmp, 10);
  const fertileWindowEnd = addDays(lmp, 15);
  const edd = addDays(lmp, 280); // Estimated Due Date

  const daysToNextPeriod = differenceInDays(nextPeriod, today);
  const isFertile = isAfter(today, fertileWindowStart) && isAfter(fertileWindowEnd, today);

  return {
    nextPeriod: format(nextPeriod, 'dd MMM yyyy'),
    daysToNextPeriod,
    fertileWindow: `${format(fertileWindowStart, 'dd MMM')} - ${format(fertileWindowEnd, 'dd MMM')}`,
    isFertile,
    edd: format(edd, 'dd MMM yyyy'),
    pregnancyWeek: Math.floor(differenceInDays(today, lmp) / 7)
  };
};

export const getTrimester = (weeks: number) => {
  if (weeks <= 12) return 'Trimester 1';
  if (weeks <= 26) return 'Trimester 2';
  return 'Trimester 3';
};
