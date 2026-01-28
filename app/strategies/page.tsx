'use client';

import { useState, useEffect } from 'react';
import {
  Settings, Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronUp,
  Play, Pause, Zap, Target, AlertCircle
} from 'lucide-react';
import { Strategy, StrategyTrigger, Condition, ConditionOperator } from '@/types';

const CONDITION_FIELDS = [
  { value: 'homeScore', label: 'Home Score' },
  { value: 'awayScore', label: 'Away Score' },
  { value: 'lead', label: 'Lead (Home - Away)' },
  { value: 'totalPoints', label: 'Total Points' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'quarterScores.q1Home', label: 'Q1 Home Score' },
  { value: 'quarterScores.q1Away', label: 'Q1 Away Score' },
  { value: 'quarterScores.q2Home', label: 'Q2 Home Score' },
  { value: 'quarterScores.q2Away', label: 'Q2 Away Score' },
  { value: 'halftimeScores.home', label: 'Halftime Home' },
  { value: 'halftimeScores.away', label: 'Halftime Away' },
  { value: 'quarterScores.q3Home', label: 'Q3 Home Score' },
  { value: 'quarterScores.q3Away', label: 'Q3 Away Score' },
  { value: 'spread', label: 'Spread' },
  { value: 'total', label: 'O/U Total' },
];

const OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: 'equals', label: '=' },
  { value: 'not_equals', label: '≠' },
  { value: 'greater_than', label: '>' },
  { value: 'less_than', label: '<' },
  { value: 'greater_than_or_equal', label: '≥' },
  { value: 'less_than_or_equal', label: '≤' },
  { value: 'between', label: 'Between' },
];

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);

  // Modal states
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [editingTrigger, setEditingTrigger] = useState<StrategyTrigger | null>(null);
  const [currentStrategyId, setCurrentStrategyId] = useState<string | null>(null);

  // Form states
  const [strategyForm, setStrategyForm] = useState({
    name: '',
    description: '',
    triggerMode: 'sequential' as 'sequential' | 'parallel',
    isActive: false,
  });

  const [triggerForm, setTriggerForm] = useState({
    name: '',
    conditions: [] as Condition[],
    order: 1,
    entryOrClose: 'entry' as 'entry' | 'close',
  });

  // Fetch strategies
  const fetchStrategies = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/strategies');
      const data = await res.json();
      if (data.success) {
        // Fetch triggers for each strategy
        const strategiesWithTriggers = await Promise.all(
          data.data.map(async (strategy: Strategy) => {
            const triggerRes = await fetch(`/api/strategies/${strategy.id}`);
            const triggerData = await triggerRes.json();
            return triggerData.success ? triggerData.data : strategy;
          })
        );
        setStrategies(strategiesWithTriggers);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch strategies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, []);

  // Strategy CRUD
  const handleSaveStrategy = async () => {
    try {
      const url = editingStrategy
        ? `/api/strategies/${editingStrategy.id}`
        : '/api/strategies';
      const method = editingStrategy ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(strategyForm),
      });

      const data = await res.json();
      if (data.success) {
        setShowStrategyModal(false);
        setEditingStrategy(null);
        resetStrategyForm();
        fetchStrategies();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to save strategy');
    }
  };

  const handleDeleteStrategy = async (id: string) => {
    if (!confirm('Delete this strategy and all its triggers?')) return;
    try {
      const res = await fetch(`/api/strategies/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchStrategies();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to delete strategy');
    }
  };

  const handleToggleActive = async (strategy: Strategy) => {
    try {
      const res = await fetch(`/api/strategies/${strategy.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !strategy.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        fetchStrategies();
      }
    } catch (err) {
      setError('Failed to toggle strategy');
    }
  };

  // Trigger CRUD
  const handleSaveTrigger = async () => {
    if (!currentStrategyId) return;
    try {
      const url = editingTrigger
        ? `/api/triggers/${editingTrigger.id}`
        : '/api/triggers';
      const method = editingTrigger ? 'PUT' : 'POST';

      const body = editingTrigger
        ? triggerForm
        : { ...triggerForm, strategyId: currentStrategyId };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setShowTriggerModal(false);
        setEditingTrigger(null);
        resetTriggerForm();
        fetchStrategies();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to save trigger');
    }
  };

  const handleDeleteTrigger = async (id: string) => {
    if (!confirm('Delete this trigger?')) return;
    try {
      const res = await fetch(`/api/triggers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchStrategies();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to delete trigger');
    }
  };

  // Form helpers
  const resetStrategyForm = () => {
    setStrategyForm({
      name: '',
      description: '',
      triggerMode: 'sequential',
      isActive: false,
    });
  };

  const resetTriggerForm = () => {
    setTriggerForm({
      name: '',
      conditions: [],
      order: 1,
      entryOrClose: 'entry',
    });
  };

  const openEditStrategy = (strategy: Strategy) => {
    setEditingStrategy(strategy);
    setStrategyForm({
      name: strategy.name,
      description: strategy.description,
      triggerMode: strategy.triggerMode,
      isActive: strategy.isActive,
    });
    setShowStrategyModal(true);
  };

  const openEditTrigger = (trigger: StrategyTrigger, strategyId: string) => {
    setCurrentStrategyId(strategyId);
    setEditingTrigger(trigger);
    setTriggerForm({
      name: trigger.name,
      conditions: trigger.conditions,
      order: trigger.order,
      entryOrClose: trigger.entryOrClose,
    });
    setShowTriggerModal(true);
  };

  const openNewTrigger = (strategyId: string) => {
    setCurrentStrategyId(strategyId);
    setEditingTrigger(null);
    resetTriggerForm();
    setShowTriggerModal(true);
  };

  // Condition helpers
  const addCondition = () => {
    setTriggerForm(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: 'lead', operator: 'greater_than', value: 0 }],
    }));
  };

  const updateCondition = (index: number, updates: Partial<Condition>) => {
    setTriggerForm(prev => ({
      ...prev,
      conditions: prev.conditions.map((c, i) => i === index ? { ...c, ...updates } : c),
    }));
  };

  const removeCondition = (index: number) => {
    setTriggerForm(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold">Strategies</h1>
            <p className="text-gray-400 text-sm">Create and manage your betting strategies</p>
          </div>
        </div>
        <button
          onClick={() => { setEditingStrategy(null); resetStrategyForm(); setShowStrategyModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Strategy
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Strategies List */}
      {strategies.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-xl">
          <Target className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No strategies yet</h3>
          <p className="text-gray-400 mb-4">Create your first strategy to start automating your bets</p>
          <button
            onClick={() => { setEditingStrategy(null); resetStrategyForm(); setShowStrategyModal(true); }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Create Strategy
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {strategies.map((strategy) => (
            <div
              key={strategy.id}
              className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden"
            >
              {/* Strategy Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleToggleActive(strategy)}
                    className={`p-2 rounded-lg transition-colors ${
                      strategy.isActive
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {strategy.isActive ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                  </button>
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {strategy.name}
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        strategy.triggerMode === 'sequential'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {strategy.triggerMode}
                      </span>
                    </h3>
                    <p className="text-sm text-gray-400">{strategy.description || 'No description'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">
                    {strategy.triggers?.length || 0} triggers
                  </span>
                  <button
                    onClick={() => openEditStrategy(strategy)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteStrategy(strategy.id)}
                    className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setExpandedStrategy(expandedStrategy === strategy.id ? null : strategy.id)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {expandedStrategy === strategy.id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Triggers Section (Expanded) */}
              {expandedStrategy === strategy.id && (
                <div className="border-t border-gray-700 p-4 bg-gray-900/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      Triggers
                    </h4>
                    <button
                      onClick={() => openNewTrigger(strategy.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Trigger
                    </button>
                  </div>

                  {strategy.triggers && strategy.triggers.length > 0 ? (
                    <div className="space-y-3">
                      {strategy.triggers.map((trigger) => (
                        <div
                          key={trigger.id}
                          className="bg-gray-800 rounded-lg p-3 border border-gray-700"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">
                                #{trigger.order}
                              </span>
                              <span className="font-medium">{trigger.name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                trigger.entryOrClose === 'entry'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {trigger.entryOrClose}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditTrigger(trigger, strategy.id)}
                                className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTrigger(trigger.id)}
                                className="p-1.5 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="text-sm text-gray-400">
                            {trigger.conditions.length === 0 ? (
                              <span className="italic">No conditions set</span>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {trigger.conditions.map((c, i) => (
                                  <span key={i} className="bg-gray-700 px-2 py-1 rounded text-xs">
                                    {CONDITION_FIELDS.find(f => f.value === c.field)?.label || c.field}{' '}
                                    {OPERATORS.find(o => o.value === c.operator)?.label || c.operator}{' '}
                                    {c.value}
                                    {c.operator === 'between' && c.value2 !== undefined && ` - ${c.value2}`}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No triggers yet. Add one to define when this strategy fires.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Strategy Modal */}
      {showStrategyModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingStrategy ? 'Edit Strategy' : 'New Strategy'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={strategyForm.name}
                  onChange={(e) => setStrategyForm({ ...strategyForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                  placeholder="e.g., Lakers Q2 Lead"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={strategyForm.description}
                  onChange={(e) => setStrategyForm({ ...strategyForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none resize-none"
                  rows={2}
                  placeholder="Describe what this strategy does..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Trigger Mode</label>
                <select
                  value={strategyForm.triggerMode}
                  onChange={(e) => setStrategyForm({ ...strategyForm, triggerMode: e.target.value as 'sequential' | 'parallel' })}
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                >
                  <option value="sequential">Sequential (triggers must fire in order)</option>
                  <option value="parallel">Parallel (any trigger can fire)</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={strategyForm.isActive}
                  onChange={(e) => setStrategyForm({ ...strategyForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded bg-gray-700 border-gray-600"
                />
                <label htmlFor="isActive" className="text-sm">Active (strategy will evaluate live games)</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowStrategyModal(false); setEditingStrategy(null); }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStrategy}
                disabled={!strategyForm.name}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trigger Modal */}
      {showTriggerModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingTrigger ? 'Edit Trigger' : 'New Trigger'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={triggerForm.name}
                  onChange={(e) => setTriggerForm({ ...triggerForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                  placeholder="e.g., Home Lead by 5+"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Order</label>
                  <input
                    type="number"
                    value={triggerForm.order}
                    onChange={(e) => setTriggerForm({ ...triggerForm, order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={triggerForm.entryOrClose}
                    onChange={(e) => setTriggerForm({ ...triggerForm, entryOrClose: e.target.value as 'entry' | 'close' })}
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="entry">Entry (open signal)</option>
                    <option value="close">Close (end signal)</option>
                  </select>
                </div>
              </div>

              {/* Conditions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Conditions</label>
                  <button
                    onClick={addCondition}
                    className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
                {triggerForm.conditions.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4 bg-gray-700/50 rounded-lg">
                    No conditions. Trigger will always fire.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {triggerForm.conditions.map((condition, index) => (
                      <div key={index} className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-lg">
                        <select
                          value={condition.field}
                          onChange={(e) => updateCondition(index, { field: e.target.value })}
                          className="flex-1 px-2 py-1.5 bg-gray-700 rounded border border-gray-600 text-sm"
                        >
                          {CONDITION_FIELDS.map((f) => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                        <select
                          value={condition.operator}
                          onChange={(e) => updateCondition(index, { operator: e.target.value as ConditionOperator })}
                          className="w-20 px-2 py-1.5 bg-gray-700 rounded border border-gray-600 text-sm"
                        >
                          {OPERATORS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={condition.value as number}
                          onChange={(e) => updateCondition(index, { value: parseFloat(e.target.value) || 0 })}
                          className="w-20 px-2 py-1.5 bg-gray-700 rounded border border-gray-600 text-sm"
                        />
                        {condition.operator === 'between' && (
                          <input
                            type="number"
                            value={condition.value2 as number || 0}
                            onChange={(e) => updateCondition(index, { value2: parseFloat(e.target.value) || 0 })}
                            className="w-20 px-2 py-1.5 bg-gray-700 rounded border border-gray-600 text-sm"
                            placeholder="max"
                          />
                        )}
                        <button
                          onClick={() => removeCondition(index)}
                          className="p-1.5 hover:bg-red-500/20 text-red-400 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowTriggerModal(false); setEditingTrigger(null); }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTrigger}
                disabled={!triggerForm.name}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
