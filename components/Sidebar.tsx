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
      <div className="p-6 border-b" style={{ borderColor: 'rgba(226, 232, 240, 0.6)' }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shadow-glow-sky">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient">MAI Bets</h1>
            <p className="text-xs font-medium" style={{ color: '#718096' }}>Sky Tech v3.0</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2">
        <div className="mb-3 px-4">
          <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: '#718096' }}>Menu</span>
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
                  <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'} transition-colors`} />
                  <span className="flex-1">{item.label}</span>
                  {item.href === '/' && (
                    <span className="w-2 h-2 bg-coral-500 rounded-full animate-pulse" style={{ backgroundColor: '#F97316' }} />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Quick Stats - Glass Card */}
      <div className="mx-3 mb-4 p-4 rounded-2xl glass" style={{
        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.15)'
      }}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-sky-500" />
          <span className="text-sm font-semibold text-sky-600">Quick Stats</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-2xl font-bold font-display" style={{ color: '#1A2332' }}>0</p>
            <p className="text-xs font-medium" style={{ color: '#718096' }}>Active</p>
          </div>
          <div>
            <p className="text-2xl font-bold font-display text-coral-500" style={{ color: '#F97316' }}>0</p>
            <p className="text-xs font-medium" style={{ color: '#718096' }}>Signals</p>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(226, 232, 240, 0.6)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium" style={{ color: '#4A5568' }}>System Online</span>
          </div>
          <span className="text-xs font-semibold" style={{ color: '#718096' }}>v3.0</span>
        </div>
      </div>
    </aside>
  );
}
