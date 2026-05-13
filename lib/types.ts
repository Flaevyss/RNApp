export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branch: string;
  oklad: number;
  avatarUrl?: string;
}

export type ScheduleStatus = 'work' | 'off';

export interface Schedule {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: ScheduleStatus;
}

export interface Revenue {
  id: string;
  date: string; // YYYY-MM-DD
  idealPlan: number;
  grossRevenue: number;
  expenses: number;
  employeeCount: number;
  timestamp: any;
}
