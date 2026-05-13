'use client';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { FileText, Calendar, User, DollarSign } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  const menuItems = [
    { title: 'Документы', icon: FileText, color: 'text-slate-400', bg: 'bg-slate-100', disabled: true },
    { title: 'График работы', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50', href: '/schedule' },
    { title: 'Личный кабинет', icon: User, color: 'text-slate-400', bg: 'bg-slate-100', disabled: true },
    { title: 'Зарплата', icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50', href: '/salary' },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Navigation />
      <main className="flex-1 p-6 lg:p-10">
        <header className="mb-10">
          <h1 className="text-2xl font-bold">Привет, {user.name}!</h1>
          <p className="text-slate-500">Рады тебя видеть снова.</p>
        </header>

        <div className="grid grid-cols-2 gap-4">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={() => item.href && router.push(item.href)}
                disabled={item.disabled}
                className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm aspect-square transition-transform active:scale-95 disabled:opacity-50"
              >
                <div className={`p-4 rounded-full ${item.bg} mb-4`}>
                  <Icon className={`w-8 h-8 ${item.color}`} />
                </div>
                <span className="font-semibold text-center text-sm">{item.title}</span>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
