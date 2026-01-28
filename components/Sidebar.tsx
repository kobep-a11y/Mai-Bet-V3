'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Target, Bell, BarChart3, Cog, Zap, TrendingUp } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Live Games', icon: Activity, color: 'emerald' },
  { href: '/strategies', label: 'Strategies', icon: Target, color: 'purple' },
  { href: '/signals', label: 'Signals', icon: Bell, color: 'amber' },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, color: 'blue' },
  { href: '/settings', label: 'Settings', icon: Cog, color: 'gray' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar fixed left-0 top-0 h-screen w-64 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center border border-purple-500/30">
            <Zap className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient">MAI Bets</h1>
            <p className="text-xs text-gray-600">Version 3.0</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2">
        <div className="mb-3 px-4">
          <span className="text-xs text-gray-600 uppercase tracking-wider font-medium">Menu</span>
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
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isActive
                      ? `bg-${item.color}-500/20`
                      : 'bg-gray-800/50'
                  }`}>
                    <Icon className={`w-4 h-4 ${isActive ? `text-${item.color}-400` : 'text-gray-500'}`} />
                  </div>
                  <span className="font-medium">{item.label}</span>
                  {item.href === '/' && (
                    <span className="ml-auto w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Quick Stats */}
      <div className="mx-3 mb-4 p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/20">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-purple-400">Quick Stats</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-2xl font-bold text-white">0</p>
            <p className="text-xs text-gray-500">Active</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400">0</p>
            <p className="text-xs text-gray-500">Signals</p>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="p-4 border-t border-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-sm text-gray-500">System Online</span>
          </div>
          <span className="text-xs text-gray-600">v3.0</span>
        </div>
      </div>
    </aside>
  );
}
