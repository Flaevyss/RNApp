'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { ScheduleEntry } from '@/lib/types';
import Navigation from '@/components/Navigation';
import { Trash2 } from 'lucide-react';
import { clsx } from 'clsx';

export default function SchedulePage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [filter, setFilter] = useState<'my' | 'all'>('my');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    let q = query(collection(db, 'schedule'), where('date', '>=', today), orderBy('date', 'asc'));
    if (filter === 'my') {
      q = query(collection(db, 'schedule'), where('employeeId', '==', user.id), where('date', '>=', today), orderBy('date', 'asc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduleEntry));
      setEntries(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [user, filter]);

  useEffect(() => {
    if (user?.role === 'admin' && filter === 'all') {
      const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
        const uMap: Record<string, string> = {};
        snapshot.docs.forEach(doc => {
          uMap[doc.id] = doc.data().name;
        });
        setUsers(uMap);
      });
      return unsubscribe;
    }
  }, [user, filter]);

  const handleUpdate = async (id: string, field: string, value: string) => {
    await updateDoc(doc(db, 'schedule', id), { [field]: value });
  };

  const toggleStatus = async (entry: ScheduleEntry) => {
    const newStatus = entry.status === 'work' ? 'off' : 'work';
    await updateDoc(doc(db, 'schedule', entry.id), { status: newStatus });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Удалить смену?')) {
      await deleteDoc(doc(db, 'schedule', id));
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Navigation />
      <main className="flex-1 p-6 lg:p-10">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">График работы</h1>
        </header>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('my')}
            className={clsx(
              "flex-1 p-3 rounded-xl font-semibold border transition-all",
              filter === 'my' ? "bg-accent text-white border-accent shadow-md shadow-blue-100" : "bg-white border-slate-200"
            )}
          >
            Мой график
          </button>
          {user?.role === 'admin' && (
            <button
              onClick={() => setFilter('all')}
              className={clsx(
                "flex-1 p-3 rounded-xl font-semibold border transition-all",
                filter === 'all' ? "bg-accent text-white border-accent shadow-md shadow-blue-100" : "bg-white border-slate-200"
              )}
            >
              Все
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center p-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.length === 0 && (
              <p className="text-center text-slate-500 py-10">Смен не найдено</p>
            )}
            {entries.map((entry) => (
              <div key={entry.id} className="bg-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900">{entry.date}</span>
                    {filter === 'all' && (
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        {users[entry.employeeId] || '...'}
                      </span>
                    )}
                  </div>

                  {user?.role === 'admin' ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="time"
                        value={entry.startTime}
                        onBlur={(e) => handleUpdate(entry.id, 'startTime', e.target.value)}
                        className="p-1 border rounded"
                        onChange={(e) => setEntries(prev => prev.map(en => en.id === entry.id ? {...en, startTime: e.target.value} : en))}
                      />
                      <span className="text-slate-400">-</span>
                      <input
                        type="time"
                        value={entry.endTime}
                        onBlur={(e) => handleUpdate(entry.id, 'endTime', e.target.value)}
                        className="p-1 border rounded"
                        onChange={(e) => setEntries(prev => prev.map(en => en.id === entry.id ? {...en, endTime: e.target.value} : en))}
                      />
                    </div>
                  ) : (
                    <p className={clsx(
                      "font-semibold",
                      entry.status === 'work' ? "text-accent" : "text-slate-400"
                    )}>
                      {entry.status === 'work' ? `${entry.startTime} - ${entry.endTime}` : 'Выходной'}
                    </p>
                  )}
                </div>

                {user?.role === 'admin' && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleStatus(entry)}
                      className={clsx(
                        "px-4 py-2 rounded-lg text-xs font-bold transition-colors",
                        entry.status === 'work' ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"
                      )}
                    >
                      {entry.status === 'work' ? 'Работа' : 'Выходной'}
                    </button>
                    <button onClick={() => handleDelete(entry.id)} className="text-slate-300 hover:text-red-500">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
