import { Revenue, ScheduleEntry, SalaryDetail, User } from './types';

export const calculateSalary = (
  user: User,
  schedule: ScheduleEntry[],
  revenues: Revenue[]
): { total: number; okladTotal: number; bonusTotal: number; details: SalaryDetail[] } => {
  let okladTotal = 0;
  let bonusTotal = 0;
  const details: SalaryDetail[] = [];

  schedule.forEach((shift) => {
    if (shift.status !== 'work') return;

    // 1. Oklad part
    const start = shift.startTime.split(':').map(Number);
    const end = shift.endTime.split(':').map(Number);
    let hours = end[0] - start[0] + (end[1] - start[1]) / 60;
    if (hours < 0) hours += 24; // Handle overnight shifts if any

    const okladPart = (user.oklad / 12) * hours;
    okladTotal += okladPart;

    // 2. Bonus part
    const revenueData = revenues.find((r) => r.date === shift.date);
    let bonusAmount = 0;
    let bonusPercentage = 0;

    if (revenueData) {
      const isPlanMet = revenueData.grossRevenue >= revenueData.idealPlan;
      const empCount = revenueData.employeeCount;

      if (empCount === 1) {
        bonusPercentage = isPlanMet ? 2.5 : 2.0;
      } else if (empCount >= 2) {
        bonusPercentage = isPlanMet ? 2.5 : 1.5;
      }

      bonusAmount = (revenueData.grossRevenue * bonusPercentage) / 100;
      bonusTotal += bonusAmount;
    }

    details.push({
      date: shift.date,
      revenue: revenueData?.grossRevenue || 0,
      bonusPercentage,
      bonusAmount,
      workHours: hours,
      okladPart,
    });
  });

  return {
    total: okladTotal + bonusTotal,
    okladTotal,
    bonusTotal,
    details: details.sort((a, b) => a.date.localeCompare(b.date)),
  };
};
