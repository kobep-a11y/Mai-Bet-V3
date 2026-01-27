'use client';

import { useState, useEffect } from 'react';
import { Target, ChevronDown, ChevronRight, Zap, AlertCircle } from 'lucide-react';
import type { Strategy, StrategyTrigger } from '@/types';

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);

  const fetchStrategies = async () => {
    try {
      setError(null);
      const response = await fetch('/api/strategies');
      const data = await response.json();

      if (data.success) {
        setStrategies(data.data);
      } else {
        setError(data.error || 'Failed to load strategies');
      }
    } catch (err) {
      setError('Failed to connect to Airtable. Check your API key and base ID.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, []);

  const formatConditions = (conditions: any[]) => {
    if (!conditions || conditions.length === 0) return 'No conditions';
    return conditions
      .map((c) => `${c.field} ${c.operator} ${c.value}${c.value2 ? `-${c.value2}` : ''}`)
      .join(' AND ');
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Target className="w-8 h-8 text-mai-500" />
            Strategies
          </h1>
          <p className="text-gray-400 mt-1">
            Manage your betting strategies • Stored in Airtable
          </p>
        </div>

        <button
          onClick={fetchStrategies}
          className="px-4 py-2 rounded-lg bg-mai-500 text-white hover:bg-mai-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-400">Connection Error</h3>
              <p className="text-sm text-red-300 mt-1">{error}</p>
              <p className="text-xs text-red-400/70 mt-2">
                Make sure your Airtable tables are created and environment variables are set.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mai-500" />
        </div>
      ) : strategies.length === 0 && !error ? (
        <div className="text-center py-20">
          <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            No strategies found
          </h3>
          <p className="text-gray-500 mb-4 max-w-md mx-auto">
            Create strategies in your Airtable base. They will automatically sync here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {strategies.map((strategy) => (
            <div
              key={strategy.id}
              className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden"
            >
              {/* Strategy Header */}
              <button
                onClick={() =>
                  setExpandedStrategy(
                    expandedStrategy === strategy.id ? null : strategy.id
                  )
                }
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-700/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      strategy.is_active ? 'bg-green-500' : 'bg-gray-500'
                    }`}
                  />
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-white">
                      {strategy.name}
                    </h3>
                    <p className="text-sm text-gray-400">{strategy.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      strategy.trigger_mode === 'sequential'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-purple-500/20 text-purple-400'
                    }`}
                  >
                    {strategy.trigger_mode}
                  </span>
                  <span className="text-sm text-gray-400">
                    {strategy.triggers.length} triggers
                  </span>
                  {expandedStrategy === strategy.id ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Expanded Triggers */}
              {expandedStrategy === strategy.id && (
                <div className="border-t border-gray-700 px-4 py-4 space-y-3">
                  {strategy.triggers.length === 0 ? (
                    <p className="text-gray-500 text-sm">No triggers configured</p>
                  ) : (
                    strategy.triggers.map((trigger, index) => (
                      <div
                        key={trigger.id}
                        className="bg-gray-900/50 rounded-lg p-4 border border-gray-700"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="w-4 h-4 text-mai-500" />
                          <span className="font-medium text-white">
                            {index + 1}. {trigger.name}
                          </span>
                          <span
                            className={`ml-auto px-2 py-0.5 rounded text-xs ${
                              trigger.is_active
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-gray-600 text-gray-400'
                            }`}
                          >
                            {trigger.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 mb-1">Entry Conditions</p>
                            <p className="text-green-400 font-mono text-xs bg-gray-800 rounded p-2">
                              {formatConditions(trigger.entry_conditions)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">Close Conditions</p>
                            <p className="text-red-400 font-mono text-xs bg-gray-800 rounded p-2">
                              {formatConditions(trigger.close_conditions)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <p className="text-xs text-gray-500">
                            Win Requirement:{' '}
                            <span className="text-mai-400">
                              {trigger.win_requirement.replace(/_/g, ' ')}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Airtable Info */}
      <div className="mt-8 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">
          📊 Strategy Management
        </h3>
        <p className="text-xs text-gray-500">
          Strategies are managed in Airtable. Create and edit them in your Airtable base,
          and they will automatically sync here. See the Airtable Schema documentation for
          the required table structure.
        </p>
      </div>
    </div>
  );
}
