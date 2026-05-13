'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, DollarSign, BarChart2, Users, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { auth } from '@/lib/firebase';
import { clsx } from 'clsx';

export default function Navigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const links = [
    { name: 'Главная', href: '/', icon: Home },
    { name: 'График', href: '/schedule', icon: Calendar },
    { name: 'Зарплата', href: '/salary', icon: DollarSign },
    { name: 'Выручка', href: '/revenue', icon: BarChart2 },
  ];

  if (user.role === 'admin') {
    links.push({ name: 'Сотрудники', href: '/employees', icon: Users });
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-50">
        <button onClick={() => setIsOpen(true)}>
          <Menu className="w-6 h-6 text-accent" />
        </button>
        <span className="font-bold text-lg">Зарплата</span>
        <div className="w-6" />
      </div>

      {/* Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar / Drawer */}
      <div className={clsx(
        "fixed inset-y-0 left-0 w-64 bg-white z-50 transform transition-transform lg:translate-x-0 lg:static",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-slate-200 mb-4 overflow-hidden border-2 border-accent">
               {user.avatarUrl ? (
                 <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-accent text-2xl font-bold">
                   {user.name?.charAt(0) || '?'}
                 </div>
               )}
            </div>
            <h2 className="font-bold text-lg text-center">{user.name || '...'}</h2>
            <p className="text-sm text-slate-500">{user.branch}</p>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={clsx(
                    "flex items-center space-x-3 p-3 rounded-xl transition-colors",
                    pathname === link.href ? "bg-accent text-white" : "hover:bg-slate-100"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{link.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            <button
              onClick={() => auth.signOut()}
              className="flex items-center space-x-3 p-3 rounded-xl text-red-500 hover:bg-red-50 w-full"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Выйти</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
