import { calculateSalary } from '../lib/salaryUtils';
import { User, ScheduleEntry, Revenue } from '../lib/types';

describe('calculateSalary', () => {
  const mockUser: User = {
    id: '1',
    name: 'Test User',
    email: 'test@ex.com',
    role: 'user',
    branch: 'Main',
    oklad: 1200, // 100 per hour
  };

  it('calculates salary correctly for 1 employee when plan is NOT met', () => {
    const schedule: ScheduleEntry[] = [
      { id: 's1', employeeId: '1', date: '2024-01-01', startTime: '08:00', endTime: '20:00', status: 'work' },
    ];
    const revenues: Revenue[] = [
      { id: 'r1', date: '2024-01-01', idealPlan: 10000, grossRevenue: 8000, expenses: 0, employeeCount: 1, timestamp: null },
    ];

    const result = calculateSalary(mockUser, schedule, revenues);

    // Oklad: (1200 / 12) * 12 = 1200
    // Bonus: 8000 * 2.0% = 160
    // Total: 1360
    expect(result.okladTotal).toBe(1200);
    expect(result.bonusTotal).toBe(160);
    expect(result.total).toBe(1360);
  });

  it('calculates salary correctly for 1 employee when plan IS met', () => {
    const schedule: ScheduleEntry[] = [
      { id: 's1', employeeId: '1', date: '2024-01-01', startTime: '08:00', endTime: '20:00', status: 'work' },
    ];
    const revenues: Revenue[] = [
      { id: 'r1', date: '2024-01-01', idealPlan: 10000, grossRevenue: 12000, expenses: 0, employeeCount: 1, timestamp: null },
    ];

    const result = calculateSalary(mockUser, schedule, revenues);

    // Oklad: 1200
    // Bonus: 12000 * 2.5% = 300
    // Total: 1500
    expect(result.bonusTotal).toBe(300);
    expect(result.total).toBe(1500);
  });

  it('calculates salary correctly for 2 employees when plan is NOT met', () => {
    const schedule: ScheduleEntry[] = [
      { id: 's1', employeeId: '1', date: '2024-01-01', startTime: '08:00', endTime: '20:00', status: 'work' },
    ];
    const revenues: Revenue[] = [
      { id: 'r1', date: '2024-01-01', idealPlan: 10000, grossRevenue: 8000, expenses: 0, employeeCount: 2, timestamp: null },
    ];

    const result = calculateSalary(mockUser, schedule, revenues);

    // Oklad: 1200
    // Bonus: 8000 * 1.5% = 120
    // Total: 1320
    expect(result.bonusTotal).toBe(120);
  });
});
