'use client';

import { BarChart3, TrendingUp, Calendar, DollarSign } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-mai-500" />
          Analytics
        </h1>
        <p className="text-gray-400 mt-1">
          Performance tracking and insights
        </p>
      </div>

      {/* Coming Soon */}
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-mai-500/20 mb-6">
          <BarChart3 className="w-10 h-10 text-mai-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">
          Analytics Coming in Phase 2
        </h2>
        <p className="text-gray-400 max-w-md mx-auto mb-8">
          Track your signal performance, strategy effectiveness, and historical results.
          This feature will be available after the core system is deployed.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <h3 className="font-semibold text-white">Win Rate Tracking</h3>
            <p className="text-sm text-gray-500 mt-1">
              Track performance by strategy
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <Calendar className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <h3 className="font-semibold text-white">Historical Analysis</h3>
            <p className="text-sm text-gray-500 mt-1">
              Review past signals and results
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <DollarSign className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <h3 className="font-semibold text-white">Profit Tracking</h3>
            <p className="text-sm text-gray-500 mt-1">
              Monitor your betting ROI
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
