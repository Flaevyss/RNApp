export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  branch: string;
  oklad: number; // Оклад за 12 часов
  avatarUrl?: string;
}

export interface ScheduleEntry {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: 'work' | 'off';
}

export interface Revenue {
  id: string;
  date: string; // YYYY-MM-DD
  idealPlan: number;
  grossRevenue: number;
  expenses: number;
  employeeCount: number;
  timestamp: any; // ServerTimestamp
}

export interface SalaryDetail {
  date: string;
  revenue: number;
  bonusPercentage: number;
  bonusAmount: number;
  workHours: number;
  okladPart: number;
}
