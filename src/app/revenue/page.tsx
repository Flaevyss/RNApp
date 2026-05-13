'use client';
import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Navigation from '@/components/Navigation';
import { Save } from 'lucide-react';

export default function RevenuePage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [idealPlan, setIdealPlan] = useState('');
  const [grossRevenue, setGrossRevenue] = useState('');
  const [expenses, setExpenses] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idealPlan || !grossRevenue || !employeeCount) {
      setMessage({ text: 'Заполните обязательные поля', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      await setDoc(doc(db, 'revenue', date), {
        date,
        idealPlan: Number(idealPlan),
        grossRevenue: Number(grossRevenue),
        expenses: Number(expenses || 0),
        employeeCount: Number(employeeCount),
        timestamp: serverTimestamp(),
      }, { merge: true });

      setMessage({ text: 'Данные успешно сохранены', type: 'success' });
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Navigation />
      <main className="flex-1 p-6 lg:p-10">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Выручка за день</h1>
        </header>

        <form onSubmit={handleSave} className="max-w-lg bg-white p-8 rounded-3xl shadow-sm space-y-6">
          {message.text && (
            <div className={`p-4 rounded-xl text-sm font-medium ${
              message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
            }`}>
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Дата</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">План (Идеал) *</label>
                <input
                  type="number"
                  value={idealPlan}
                  onChange={(e) => setIdealPlan(e.target.value)}
                  placeholder="0"
                  className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Выручка *</label>
                <input
                  type="number"
                  value={grossRevenue}
                  onChange={(e) => setGrossRevenue(e.target.value)}
                  placeholder="0"
                  className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Расходы</label>
              <input
                type="number"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                placeholder="0"
                className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Сотрудников на смене *</label>
              <input
                type="number"
                value={employeeCount}
                onChange={(e) => setEmployeeCount(e.target.value)}
                placeholder="0"
                className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-success text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors disabled:bg-slate-300"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </form>
      </main>
    </div>
  );
}
