'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Target,
  Bell,
  Settings,
  BarChart3,
  Zap,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Live Games', icon: Activity },
  { href: '/strategies', label: 'Strategies', icon: Target },
  { href: '/signals', label: 'Signals', icon: Bell },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="w-64 bg-gray-800/50 backdrop-blur-sm border-r border-gray-700 p-4 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-mai-500 to-mai-600 flex items-center justify-center">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">MAI Bets</h1>
          <p className="text-xs text-gray-400">V3.0</p>
        </div>
      </div>

      {/* Nav Links */}
      <ul className="space-y-1 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-mai-500/20 text-mai-400 border-l-2 border-mai-500'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Status Footer */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-gray-400">System Online</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
