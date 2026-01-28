'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Target, Bell, BarChart3, Cog, Zap, TrendingUp, Users, Wallet } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Live Games', icon: Activity },
  { href: '/strategies', label: 'Strategies', icon: Target },
  { href: '/signals', label: 'Signals', icon: Bell },
  { href: '/bankroll', label: 'Bankroll', icon: Wallet },
  { href: '/players', label: 'Players', icon: Users },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Cog },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar fixed left-0 top-0 h-screen w-64 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-orange-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">MAI Bets</h1>
            <p className="text-xs text-slate-400">Version 3.0</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2">
        <div className="mb-3 px-4">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Menu</span>
        </div>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.href === '/' && (
                    <span className="ml-auto w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Quick Stats */}
      <div className="mx-3 mb-4 p-4 bg-gradient-to-br from-purple-50 to-orange-50 rounded-xl border border-purple-100">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-600">Quick Stats</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-2xl font-bold text-slate-800">0</p>
            <p className="text-xs text-slate-500">Active</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-500">0</p>
            <p className="text-xs text-slate-500">Signals</p>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-sm text-slate-500">System Online</span>
          </div>
          <span className="text-xs text-slate-400">v3.0</span>
        </div>
      </div>
    </aside>
  );
}
