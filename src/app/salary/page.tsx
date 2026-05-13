'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ScheduleEntry, Revenue, SalaryDetail } from '@/lib/types';
import { calculateSalary } from '@/lib/salaryUtils';
import Navigation from '@/components/Navigation';
import { clsx } from 'clsx';

export default function SalaryPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'current' | 'last'>('current');
  const [loading, setLoading] = useState(true);
  const [salaryData, setSalaryData] = useState<{
    total: number;
    okladTotal: number;
    bonusTotal: number;
    details: SalaryDetail[];
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);

      const now = new Date();
      let start: Date, end: Date;

      if (period === 'current') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
      }

      const startDateStr = start.toISOString().split('T')[0];
      const endDateStr = end.toISOString().split('T')[0];

      try {
        const scheduleQuery = query(
          collection(db, 'schedule'),
          where('employeeId', '==', user.id),
          where('date', '>=', startDateStr),
          where('date', '<=', endDateStr)
        );
        const scheduleSnap = await getDocs(scheduleQuery);
        const schedule = scheduleSnap.docs.map(doc => doc.data() as ScheduleEntry);

        const revenueQuery = query(
          collection(db, 'revenue'),
          where('date', '>=', startDateStr),
          where('date', '<=', endDateStr)
        );
        const revenueSnap = await getDocs(revenueQuery);
        const revenues = revenueSnap.docs.map(doc => doc.data() as Revenue);

        const result = calculateSalary(user, schedule, revenues);
        setSalaryData(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, period]);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Navigation />
      <main className="flex-1 p-6 lg:p-10">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Зарплата</h1>
        </header>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setPeriod('current')}
            className={clsx(
              "flex-1 p-3 rounded-xl font-semibold border transition-all",
              period === 'current' ? "bg-accent text-white border-accent shadow-md shadow-blue-100" : "bg-white border-slate-200"
            )}
          >
            Текущий месяц
          </button>
          <button
            onClick={() => setPeriod('last')}
            className={clsx(
              "flex-1 p-3 rounded-xl font-semibold border transition-all",
              period === 'last' ? "bg-accent text-white border-accent shadow-md shadow-blue-100" : "bg-white border-slate-200"
            )}
          >
            Прошлый месяц
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
          </div>
        ) : salaryData ? (
          <div className="space-y-6">
            <div className="bg-accent p-8 rounded-[2rem] text-white shadow-xl shadow-blue-200 relative overflow-hidden">
               <div className="relative z-10">
                  <p className="text-blue-100 font-medium mb-1">Итого к выплате</p>
                  <h2 className="text-4xl font-black mb-6">{salaryData.total.toLocaleString(undefined, { maximumFractionDigits: 0 })} ₽</h2>
                  <div className="flex gap-10 border-t border-white/20 pt-6">
                    <div>
                      <p className="text-xs text-blue-100 mb-1 opacity-80 uppercase tracking-widest">Оклад</p>
                      <p className="text-lg font-bold">{salaryData.okladTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })} ₽</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-100 mb-1 opacity-80 uppercase tracking-widest">Бонусы</p>
                      <p className="text-lg font-bold">{salaryData.bonusTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })} ₽</p>
                    </div>
                  </div>
               </div>
               <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Детализация по дням</h3>
              <div className="space-y-3">
                {salaryData.details.map((item) => (
                  <div key={item.date} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50">
                    <div className="flex justify-between items-start mb-2">
                       <span className="font-bold text-slate-900">{item.date}</span>
                       <span className="text-sm font-semibold text-accent">+{item.bonusAmount.toFixed(0)} ₽ бонус</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
                       <div className="bg-slate-50 p-2 rounded-lg">
                          <p>Выручка: <span className="text-slate-900 font-bold">{item.revenue.toLocaleString()} ₽</span></p>
                          <p>Процент: <span className="text-slate-900 font-bold">{item.bonusPercentage}%</span></p>
                       </div>
                       <div className="bg-slate-50 p-2 rounded-lg">
                          <p>Часы: <span className="text-slate-900 font-bold">{item.workHours.toFixed(1)}</span></p>
                          <p>Окладная ч.: <span className="text-slate-900 font-bold">{item.okladPart.toFixed(0)} ₽</span></p>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-slate-500 py-10">Нет данных за этот период</p>
        )}
      </main>
    </div>
  );
}
