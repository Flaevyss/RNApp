'use client';
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { UserProfile } from '@/lib/types';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/lib/authContext';
import { UserPlus, Trash2, X } from 'lucide-react';

export default function EmployeesPage() {
  const { user: currentUser } = useAuth();
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [branch, setBranch] = useState('');
  const [oklad, setOklad] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as UserProfile))
        .filter(u => u.id !== currentUser.id);
      setEmployees(data);
    });
    return unsubscribe;
  }, [currentUser]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!confirm('Внимание: После создания сотрудника вы будете разлогинены из системы (ограничение клиентского SDK). Продолжить?')) {
        return;
    }

    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, '123456');
      const newUser: UserProfile = {
        id: res.user.uid,
        name,
        email,
        branch,
        oklad: Number(oklad),
        role: 'user',
      };
      await setDoc(doc(db, 'users', res.user.uid), newUser);
      alert('Сотрудник добавлен. Пароль: 123456. Вы будете перенаправлены.');
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Удалить сотрудника?')) {
      await deleteDoc(doc(db, 'users', id));
    }
  };

  if (currentUser?.role !== 'admin') {
     return <div className="p-10 text-center">Доступ запрещен</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Navigation />
      <main className="flex-1 p-6 lg:p-10">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Управление сотрудниками</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-accent text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Добавить
          </button>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {employees.map((emp) => (
            <div key={emp.id} className="bg-white p-5 rounded-2xl shadow-sm flex items-center justify-between border border-slate-50">
              <div>
                <h3 className="font-bold text-slate-900">{emp.name}</h3>
                <p className="text-sm text-slate-500">{emp.email}</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-[10px] uppercase font-black tracking-tighter bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                    {emp.branch}
                  </span>
                  <span className="text-[10px] uppercase font-black tracking-tighter bg-green-50 text-green-600 px-2 py-0.5 rounded">
                    {emp.oklad} ₽
                  </span>
                </div>
              </div>
              <button onClick={() => handleDelete(emp.id)} className="text-slate-300 hover:text-red-500">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-[2rem] p-8 relative">
              <button onClick={() => setIsModalOpen(false)} className="absolute right-6 top-6 text-slate-400">
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold mb-6">Новый сотрудник</h2>

              <form onSubmit={handleAdd} className="space-y-4">
                {error && <div className="p-3 bg-red-50 text-red-500 text-xs rounded-lg">{error}</div>}

                <input
                  type="text"
                  placeholder="Имя Фамилия"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-accent"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-accent"
                  required
                />
                <input
                  type="text"
                  placeholder="Филиал"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-accent"
                  required
                />
                <input
                  type="number"
                  placeholder="Оклад за 12 часов"
                  value={oklad}
                  onChange={(e) => setOklad(e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-accent"
                  required
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent text-white p-4 rounded-2xl font-bold mt-4 disabled:bg-slate-300"
                >
                  {loading ? 'Создание...' : 'Создать сотрудника'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
