import { Schedule, Revenue } from './types';
import { differenceInHours, parse } from 'date-fns';

export interface SalaryDetail {
  date: string;
  okladPart: number;
  bonusPart: number;
  total: number;
  revenue: number;
  percent: number;
  hours: number;
}

export function calculateSalary(
  oklad: number,
  schedules: Schedule[],
  revenues: Revenue[]
): { total: number; okladTotal: number; bonusTotal: number; details: SalaryDetail[] } {
  let okladTotal = 0;
  let bonusTotal = 0;
  const details: SalaryDetail[] = [];

  const revenueMap = new Map<string, Revenue>();
  revenues.forEach(r => revenueMap.set(r.date, r));

  schedules.forEach(shift => {
    if (shift.status === 'off') return;

    let okladPart = 0;
    let hours = 0;

    if (shift.startTime && shift.endTime) {
      const start = parse(shift.startTime, 'HH:mm', new Date());
      const end = parse(shift.endTime, 'HH:mm', new Date());
      hours = differenceInHours(end, start);
      if (hours < 0) hours += 24; // Handle night shifts if any

      okladPart = (oklad / 12) * hours;
    }

    const revenueData = revenueMap.get(shift.date);
    let bonusPart = 0;
    let percent = 0;
    let grossRevenue = 0;

    if (revenueData) {
      grossRevenue = revenueData.grossRevenue;
      const planMet = grossRevenue >= revenueData.idealPlan;
      const count = revenueData.employeeCount;

      if (count === 1) {
        percent = planMet ? 2.5 : 2.0;
      } else if (count >= 2) {
        percent = planMet ? 2.5 : 1.5;
      }

      bonusPart = (grossRevenue * percent) / 100;
    }

    okladTotal += okladPart;
    bonusTotal += bonusPart;

    details.push({
      date: shift.date,
      okladPart,
      bonusPart,
      total: okladPart + bonusPart,
      revenue: grossRevenue,
      percent,
      hours
    });
  });

  return {
    total: okladTotal + bonusTotal,
    okladTotal,
    bonusTotal,
    details: details.sort((a, b) => a.date.localeCompare(b.date))
  };
}
