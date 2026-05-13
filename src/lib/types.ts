export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  branch: string;
  oklad: number;
  avatarUrl?: string;
}

export interface ScheduleEntry {
  id: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'work' | 'off';
}

export interface Revenue {
  id: string;
  date: string;
  idealPlan: number;
  grossRevenue: number;
  expenses: number;
  employeeCount: number;
  timestamp: any;
}

export interface SalaryDetail {
  date: string;
  revenue: number;
  bonusPercentage: number;
  bonusAmount: number;
  workHours: number;
  okladPart: number;
}
