'use client';

import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-8 h-8 text-blue-500" />
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
          <p className="text-slate-500 text-sm">Performance metrics and insights</p>
        </div>
      </div>

      <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
        <BarChart3 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h3 className="text-xl font-semibold text-slate-700 mb-2">Coming Soon</h3>
        <p className="text-slate-500">Analytics dashboard is under development</p>
      </div>
    </div>
  );
}
