'use client';

import { useState, useEffect } from 'react';
import {
  Settings, Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronUp,
  Play, Pause, Zap, Target, AlertCircle, Sparkles, Search,
  MessageSquare, Clock, Filter, BarChart3, Brain, Wand2, Eye
} from 'lucide-react';
import { Strategy, StrategyTrigger, Condition, ConditionOperator } from '@/types';

// ============================================
// COMPREHENSIVE CONDITION FIELDS (60+)
// Organized by category like V2 Lovable UI
// ============================================

interface ConditionFieldCategory {
  name: string;
  icon: string;
  fields: { value: string; label: string; type: 'number' | 'string' }[];
}

const CONDITION_CATEGORIES: ConditionFieldCategory[] = [
  {
    name: 'Current Game',
    icon: '🎮',
    fields: [
      { value: 'currentLead', label: 'Current Lead', type: 'number' },
      { value: 'quarter', label: 'Quarter', type: 'number' },
      { value: 'homeScore', label: 'Home Score', type: 'number' },
      { value: 'awayScore', label: 'Away Score', type: 'number' },
      { value: 'totalPoints', label: 'Total Points', type: 'number' },
      { value: 'gameTimeMinutes', label: 'Game Time (Minutes)', type: 'number' },
      { value: 'gameTimeSeconds', label: 'Game Time (Seconds)', type: 'number' },
    ],
  },
  {
    name: 'Home Team Stats',
    icon: '🏠',
    fields: [
      { value: 'homeWinPct', label: 'Home Win %', type: 'number' },
      { value: 'homePtsPerMatch', label: 'Home Pts/Match', type: 'number' },
      { value: 'homeGamesPlayed', label: 'Home Games Played', type: 'number' },
      { value: 'homeRecentWinsL5', label: 'Home Recent Wins (L5)', type: 'number' },
      { value: 'homeRecentWinsL10', label: 'Home Recent Wins (L10)', type: 'number' },
    ],
  },
  {
    name: 'Away Team Stats',
    icon: '✈️',
    fields: [
      { value: 'awayWinPct', label: 'Away Win %', type: 'number' },
      { value: 'awayPtsPerMatch', label: 'Away Pts/Match', type: 'number' },
      { value: 'awayGamesPlayed', label: 'Away Games Played', type: 'number' },
      { value: 'awayRecentWinsL5', label: 'Away Recent Wins (L5)', type: 'number' },
      { value: 'awayRecentWinsL10', label: 'Away Recent Wins (L10)', type: 'number' },
    ],
  },
  {
    name: 'Q1 Scores',
    icon: '1️⃣',
    fields: [
      { value: 'q1Home', label: 'Q1 Home', type: 'number' },
      { value: 'q1Away', label: 'Q1 Away', type: 'number' },
      { value: 'q1Lead', label: 'Q1 Lead', type: 'number' },
      { value: 'q1Total', label: 'Q1 Total', type: 'number' },
    ],
  },
  {
    name: 'Q2 Scores',
    icon: '2️⃣',
    fields: [
      { value: 'q2Home', label: 'Q2 Home', type: 'number' },
      { value: 'q2Away', label: 'Q2 Away', type: 'number' },
      { value: 'q2Lead', label: 'Q2 Lead', type: 'number' },
      { value: 'q2Total', label: 'Q2 Total', type: 'number' },
    ],
  },
  {
    name: 'Halftime',
    icon: '⏸️',
    fields: [
      { value: 'halftimeHome', label: 'Halftime Home', type: 'number' },
      { value: 'halftimeAway', label: 'Halftime Away', type: 'number' },
      { value: 'halftimeLead', label: 'Halftime Lead', type: 'number' },
      { value: 'halftimeTotal', label: 'Halftime Total', type: 'number' },
    ],
  },
  {
    name: 'Q3 Scores',
    icon: '3️⃣',
    fields: [
      { value: 'q3Home', label: 'Q3 Home', type: 'number' },
      { value: 'q3Away', label: 'Q3 Away', type: 'number' },
      { value: 'q3Lead', label: 'Q3 Lead', type: 'number' },
      { value: 'q3Total', label: 'Q3 Total', type: 'number' },
    ],
  },
  {
    name: 'Q4 Scores',
    icon: '4️⃣',
    fields: [
      { value: 'q4Home', label: 'Q4 Home', type: 'number' },
      { value: 'q4Away', label: 'Q4 Away', type: 'number' },
      { value: 'q4Lead', label: 'Q4 Lead', type: 'number' },
      { value: 'q4Total', label: 'Q4 Total', type: 'number' },
    ],
  },
  {
    name: 'Odds & Lines',
    icon: '📊',
    fields: [
      { value: 'homeSpread', label: 'Home Spread', type: 'number' },
      { value: 'awaySpread', label: 'Away Spread', type: 'number' },
      { value: 'homeML', label: 'Home Moneyline', type: 'number' },
      { value: 'awayML', label: 'Away Moneyline', type: 'number' },
      { value: 'totalLine', label: 'Total (O/U)', type: 'number' },
      { value: 'leadingTeamSpread', label: 'Leading Team Spread', type: 'number' },
      { value: 'losingTeamSpread', label: 'Losing Team Spread', type: 'number' },
      { value: 'leadingTeamML', label: 'Leading Team ML', type: 'number' },
      { value: 'losingTeamML', label: 'Losing Team ML', type: 'number' },
    ],
  },
];

// Flatten for easy lookup
const ALL_CONDITION_FIELDS = CONDITION_CATEGORIES.flatMap(cat =>
  cat.fields.map(f => ({ ...f, category: cat.name }))
);

const OPERATORS: { value: ConditionOperator; label: string; symbol: string }[] = [
  { value: 'equals', label: 'Equals', symbol: '=' },
  { value: 'not_equals', label: 'Not Equals', symbol: '≠' },
  { value: 'greater_than', label: 'Greater Than', symbol: '>' },
  { value: 'less_than', label: 'Less Than', symbol: '<' },
  { value: 'greater_than_or_equal', label: 'Greater or Equal', symbol: '≥' },
  { value: 'less_than_or_equal', label: 'Less or Equal', symbol: '≤' },
  { value: 'between', label: 'Between', symbol: '↔' },
];

// Discord template variables
const DISCORD_VARIABLES = [
  { key: '{home_team}', label: 'Home Team' },
  { key: '{away_team}', label: 'Away Team' },
  { key: '{home_score}', label: 'Home Score' },
  { key: '{away_score}', label: 'Away Score' },
  { key: '{current_lead}', label: 'Current Lead' },
  { key: '{quarter}', label: 'Quarter' },
  { key: '{game_time}', label: 'Game Time' },
  { key: '{home_spread}', label: 'Home Spread' },
  { key: '{away_spread}', label: 'Away Spread' },
  { key: '{home_ml}', label: 'Home ML' },
  { key: '{away_ml}', label: 'Away ML' },
  { key: '{total}', label: 'Total' },
  { key: '{strategy_name}', label: 'Strategy Name' },
];

// Win requirement types
const WIN_REQUIREMENTS = [
  { value: 'none', label: 'No win requirement' },
  { value: 'leading_team_wins', label: 'Leading team at trigger time wins' },
  { value: 'home_team_wins', label: 'Home team wins' },
  { value: 'away_team_wins', label: 'Away team wins' },
  { value: 'final_lead_gte', label: 'Final lead ≥ value' },
];

// Builder mode tabs
type BuilderMode = 'manual' | 'ai-builder' | 'ai-discovery';

// ============================================
// INTERFACES
// ============================================

interface StrategyRules {
  firstHalfOnly: boolean;
  secondHalfOnly: boolean;
  excludeOvertime: boolean;
  specificQuarter?: number;
  stopAtTime?: number;
  minimumCombinedScore?: number;
}

interface WinRequirement {
  type: 'none' | 'leading_team_wins' | 'home_team_wins' | 'away_team_wins' | 'final_lead_gte';
  value?: number;
}

interface StrategyFormData {
  name: string;
  description: string;
  triggerMode: 'sequential' | 'parallel';
  isActive: boolean;
  entryConditions: Condition[];
  closeConditions: Condition[];
  hasAdvancedClose: boolean;
  rules: StrategyRules;
  winRequirement: WinRequirement;
  discordTemplate: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);

  // Builder modal state
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderMode, setBuilderMode] = useState<BuilderMode>('manual');
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);

  // AI Builder state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  // AI Discovery state
  const [discoveryRunning, setDiscoveryRunning] = useState(false);
  const [discoveredPatterns, setDiscoveredPatterns] = useState<Array<{
    pattern: string;
    winRate: number;
    sampleSize: number;
    conditions: Condition[];
  }>>([]);

  // Form state
  const [form, setForm] = useState<StrategyFormData>({
    name: '',
    description: '',
    triggerMode: 'sequential',
    isActive: false,
    entryConditions: [],
    closeConditions: [],
    hasAdvancedClose: false,
    rules: {
      firstHalfOnly: false,
      secondHalfOnly: false,
      excludeOvertime: false,
    },
    winRequirement: { type: 'none' },
    discordTemplate: '🏀 **{strategy_name}** Signal!\n\n{away_team} @ {home_team}\nScore: {away_score} - {home_score}\nLead: {current_lead} | Q{quarter} {game_time}\n\nSpread: {home_spread} | ML: {home_ml}/{away_ml}',
  });

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchStrategies = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/strategies');
      const data = await res.json();
      if (data.success) {
        const strategiesWithTriggers = await Promise.all(
          data.data.map(async (strategy: Strategy) => {
            const triggerRes = await fetch(`/api/strategies/${strategy.id}`);
            const triggerData = await triggerRes.json();
            return triggerData.success ? triggerData.data : strategy;
          })
        );
        setStrategies(strategiesWithTriggers);
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

  // ============================================
  // HANDLERS
  // ============================================

  const handleSaveStrategy = async () => {
    try {
      // Convert form to API format
      const entryTrigger: Omit<StrategyTrigger, 'id' | 'strategyId'> = {
        name: `${form.name} - Entry`,
        conditions: form.entryConditions,
        order: 1,
        entryOrClose: 'entry',
      };

      const closeTrigger: Omit<StrategyTrigger, 'id' | 'strategyId'> | null =
        form.hasAdvancedClose && form.closeConditions.length > 0
          ? {
              name: `${form.name} - Close`,
              conditions: form.closeConditions,
              order: 2,
              entryOrClose: 'close',
            }
          : null;

      // Save strategy
      const url = editingStrategy ? `/api/strategies/${editingStrategy.id}` : '/api/strategies';
      const method = editingStrategy ? 'PUT' : 'POST';

      const strategyRes = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          triggerMode: form.triggerMode,
          isActive: form.isActive,
          // Store rules and templates in description as JSON for now (can enhance later)
          metadata: JSON.stringify({
            rules: form.rules,
            winRequirement: form.winRequirement,
            discordTemplate: form.discordTemplate,
          }),
        }),
      });

      const strategyData = await strategyRes.json();

      if (strategyData.success) {
        const strategyId = strategyData.data.id;

        // Delete existing triggers if editing
        if (editingStrategy?.triggers) {
          for (const trigger of editingStrategy.triggers) {
            await fetch(`/api/triggers/${trigger.id}`, { method: 'DELETE' });
          }
        }

        // Save entry trigger
        await fetch('/api/triggers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...entryTrigger, strategyId }),
        });

        // Save close trigger if exists
        if (closeTrigger) {
          await fetch('/api/triggers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...closeTrigger, strategyId }),
          });
        }

        setShowBuilder(false);
        resetForm();
        fetchStrategies();
      } else {
        setError(strategyData.error);
      }
    } catch (err) {
      setError('Failed to save strategy');
    }
  };

  const handleDeleteStrategy = async (id: string) => {
    if (!confirm('Delete this strategy and all its triggers?')) return;
    try {
      await fetch(`/api/strategies/${id}`, { method: 'DELETE' });
      fetchStrategies();
    } catch (err) {
      setError('Failed to delete');
    }
  };

  const handleToggleActive = async (strategy: Strategy) => {
    await fetch(`/api/strategies/${strategy.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !strategy.isActive }),
    });
    fetchStrategies();
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      triggerMode: 'sequential',
      isActive: false,
      entryConditions: [],
      closeConditions: [],
      hasAdvancedClose: false,
      rules: {
        firstHalfOnly: false,
        secondHalfOnly: false,
        excludeOvertime: false,
      },
      winRequirement: { type: 'none' },
      discordTemplate: '🏀 **{strategy_name}** Signal!\n\n{away_team} @ {home_team}\nScore: {away_score} - {home_score}\nLead: {current_lead} | Q{quarter} {game_time}\n\nSpread: {home_spread} | ML: {home_ml}/{away_ml}',
    });
    setEditingStrategy(null);
    setAiPrompt('');
  };

  const openEditStrategy = (strategy: Strategy) => {
    setEditingStrategy(strategy);

    const entryTrigger = strategy.triggers?.find(t => t.entryOrClose === 'entry');
    const closeTrigger = strategy.triggers?.find(t => t.entryOrClose === 'close');

    // Parse metadata if available
    let metadata = { rules: {}, winRequirement: { type: 'none' }, discordTemplate: '' };
    try {
      // Check if description contains metadata
      const desc = strategy.description || '';
      if (desc.includes('metadata:')) {
        metadata = JSON.parse(desc.split('metadata:')[1]);
      }
    } catch {}

    setForm({
      name: strategy.name,
      description: strategy.description || '',
      triggerMode: strategy.triggerMode,
      isActive: strategy.isActive,
      entryConditions: entryTrigger?.conditions || [],
      closeConditions: closeTrigger?.conditions || [],
      hasAdvancedClose: !!closeTrigger,
      rules: metadata.rules as StrategyRules || {
        firstHalfOnly: false,
        secondHalfOnly: false,
        excludeOvertime: false,
      },
      winRequirement: metadata.winRequirement as WinRequirement || { type: 'none' },
      discordTemplate: metadata.discordTemplate || form.discordTemplate,
    });

    setBuilderMode('manual');
    setShowBuilder(true);
  };

  // ============================================
  // CONDITION HANDLERS
  // ============================================

  const addCondition = (type: 'entry' | 'close') => {
    const newCondition: Condition = {
      field: 'currentLead',
      operator: 'greater_than',
      value: 0,
    };

    if (type === 'entry') {
      setForm(f => ({ ...f, entryConditions: [...f.entryConditions, newCondition] }));
    } else {
      setForm(f => ({ ...f, closeConditions: [...f.closeConditions, newCondition] }));
    }
  };

  const updateCondition = (type: 'entry' | 'close', index: number, updates: Partial<Condition>) => {
    if (type === 'entry') {
      setForm(f => ({
        ...f,
        entryConditions: f.entryConditions.map((c, i) => i === index ? { ...c, ...updates } : c),
      }));
    } else {
      setForm(f => ({
        ...f,
        closeConditions: f.closeConditions.map((c, i) => i === index ? { ...c, ...updates } : c),
      }));
    }
  };

  const removeCondition = (type: 'entry' | 'close', index: number) => {
    if (type === 'entry') {
      setForm(f => ({ ...f, entryConditions: f.entryConditions.filter((_, i) => i !== index) }));
    } else {
      setForm(f => ({ ...f, closeConditions: f.closeConditions.filter((_, i) => i !== index) }));
    }
  };

  // ============================================
  // AI FUNCTIONS
  // ============================================

  const handleAIGenerate = async () => {
    setAiGenerating(true);
    try {
      // Simulate AI generation (in production, this would call an AI API)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Parse the prompt and generate conditions
      const prompt = aiPrompt.toLowerCase();
      const conditions: Condition[] = [];

      if (prompt.includes('lead') || prompt.includes('ahead')) {
        const match = prompt.match(/(\d+)/);
        conditions.push({
          field: 'currentLead',
          operator: 'greater_than_or_equal',
          value: match ? parseInt(match[1]) : 5,
        });
      }

      if (prompt.includes('halftime') || prompt.includes('half time')) {
        conditions.push({
          field: 'quarter',
          operator: 'equals',
          value: 2,
        });
      }

      if (prompt.includes('q3') || prompt.includes('third quarter')) {
        conditions.push({
          field: 'quarter',
          operator: 'equals',
          value: 3,
        });
      }

      if (conditions.length === 0) {
        conditions.push({
          field: 'currentLead',
          operator: 'greater_than',
          value: 5,
        });
      }

      setForm(f => ({
        ...f,
        name: aiPrompt.slice(0, 50),
        description: `AI-generated from: "${aiPrompt}"`,
        entryConditions: conditions,
      }));

      setBuilderMode('manual');
    } catch (err) {
      setError('AI generation failed');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAIDiscovery = async () => {
    setDiscoveryRunning(true);
    try {
      // Simulate pattern discovery (in production, this would analyze historical data)
      await new Promise(resolve => setTimeout(resolve, 3000));

      setDiscoveredPatterns([
        {
          pattern: 'When halftime lead ≥ 8 points',
          winRate: 72.4,
          sampleSize: 156,
          conditions: [
            { field: 'halftimeLead', operator: 'greater_than_or_equal', value: 8 },
          ],
        },
        {
          pattern: 'Q3 comeback: Down at half, up in Q3',
          winRate: 68.2,
          sampleSize: 89,
          conditions: [
            { field: 'halftimeLead', operator: 'less_than', value: 0 },
            { field: 'q3Lead', operator: 'greater_than', value: 0 },
          ],
        },
        {
          pattern: 'High scoring Q1 (50+ combined)',
          winRate: 65.8,
          sampleSize: 124,
          conditions: [
            { field: 'q1Total', operator: 'greater_than_or_equal', value: 50 },
          ],
        },
      ]);
    } catch (err) {
      setError('Discovery failed');
    } finally {
      setDiscoveryRunning(false);
    }
  };

  const createFromPattern = (pattern: typeof discoveredPatterns[0]) => {
    setForm(f => ({
      ...f,
      name: pattern.pattern.slice(0, 50),
      description: `Discovered pattern with ${pattern.winRate}% win rate (n=${pattern.sampleSize})`,
      entryConditions: pattern.conditions,
    }));
    setBuilderMode('manual');
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderConditionEditor = (
    conditions: Condition[],
    type: 'entry' | 'close'
  ) => (
    <div className="space-y-3">
      {conditions.map((condition, index) => (
        <div key={index} className="flex items-center gap-2 bg-gray-700/50 p-3 rounded-lg">
          {/* Field selector with categories */}
          <select
            value={condition.field}
            onChange={e => updateCondition(type, index, { field: e.target.value })}
            className="flex-1 px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-sm"
          >
            {CONDITION_CATEGORIES.map(category => (
              <optgroup key={category.name} label={`${category.icon} ${category.name}`}>
                {category.fields.map(field => (
                  <option key={field.value} value={field.value}>
                    {field.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {/* Operator */}
          <select
            value={condition.operator}
            onChange={e => updateCondition(type, index, { operator: e.target.value as ConditionOperator })}
            className="w-28 px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-sm"
          >
            {OPERATORS.map(op => (
              <option key={op.value} value={op.value}>
                {op.symbol} {op.label}
              </option>
            ))}
          </select>

          {/* Value */}
          <input
            type="number"
            value={condition.value as number}
            onChange={e => updateCondition(type, index, { value: parseFloat(e.target.value) || 0 })}
            className="w-24 px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-sm"
          />

          {/* Between value2 */}
          {condition.operator === 'between' && (
            <>
              <span className="text-gray-400">and</span>
              <input
                type="number"
                value={condition.value2 as number || 0}
                onChange={e => updateCondition(type, index, { value2: parseFloat(e.target.value) || 0 })}
                className="w-24 px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 text-sm"
              />
            </>
          )}

          {/* Remove */}
          <button
            onClick={() => removeCondition(type, index)}
            className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}

      <button
        onClick={() => addCondition(type)}
        className="w-full py-2 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-purple-500 hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" /> Add Condition
      </button>
    </div>
  );

  const renderDiscordPreview = () => {
    const preview = form.discordTemplate
      .replace('{strategy_name}', form.name || 'Strategy')
      .replace('{home_team}', 'LA Lakers')
      .replace('{away_team}', 'BOS Celtics')
      .replace('{home_score}', '58')
      .replace('{away_score}', '54')
      .replace('{current_lead}', '+4')
      .replace('{quarter}', '3')
      .replace('{game_time}', '4:30')
      .replace('{home_spread}', '-3.5')
      .replace('{away_spread}', '+3.5')
      .replace('{home_ml}', '-150')
      .replace('{away_ml}', '+130')
      .replace('{total}', '210.5');

    return (
      <div className="bg-[#36393f] rounded-lg p-4 font-sans text-[#dcddde] whitespace-pre-wrap">
        {preview.split('**').map((part, i) =>
          i % 2 === 1 ? <strong key={i} className="text-white">{part}</strong> : part
        )}
      </div>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold">Strategy Builder</h1>
            <p className="text-gray-400 text-sm">Create, manage, and discover betting strategies</p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowBuilder(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" /> New Strategy
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Strategy List */}
      {strategies.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/50 rounded-xl">
          <Target className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No strategies yet</h3>
          <p className="text-gray-400 mb-6">Create your first strategy to start generating signals</p>
          <button
            onClick={() => setShowBuilder(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg"
          >
            <Sparkles className="w-5 h-5" /> Create Strategy
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {strategies.map(strategy => (
            <div
              key={strategy.id}
              className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden"
            >
              {/* Strategy header */}
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
                    {strategy.isActive ? (
                      <Play className="w-5 h-5" />
                    ) : (
                      <Pause className="w-5 h-5" />
                    )}
                  </button>
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {strategy.name}
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          strategy.triggerMode === 'sequential'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-orange-500/20 text-orange-400'
                        }`}
                      >
                        {strategy.triggerMode}
                      </span>
                    </h3>
                    <p className="text-sm text-gray-400">
                      {strategy.description || 'No description'}
                    </p>
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
                    onClick={() =>
                      setExpandedStrategy(
                        expandedStrategy === strategy.id ? null : strategy.id
                      )
                    }
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

              {/* Expanded triggers */}
              {expandedStrategy === strategy.id && (
                <div className="border-t border-gray-700 p-4 bg-gray-900/50">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <h4 className="font-medium">Triggers</h4>
                  </div>
                  {strategy.triggers && strategy.triggers.length > 0 ? (
                    <div className="space-y-3">
                      {strategy.triggers.map(trigger => (
                        <div
                          key={trigger.id}
                          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">
                                #{trigger.order}
                              </span>
                              <span className="font-medium">{trigger.name}</span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded ${
                                  trigger.entryOrClose === 'entry'
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}
                              >
                                {trigger.entryOrClose}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {trigger.conditions.map((c, i) => {
                              const field = ALL_CONDITION_FIELDS.find(f => f.value === c.field);
                              const op = OPERATORS.find(o => o.value === c.operator);
                              return (
                                <span
                                  key={i}
                                  className="bg-gray-700 px-3 py-1 rounded text-sm"
                                >
                                  {field?.label || c.field} {op?.symbol} {c.value}
                                  {c.operator === 'between' && ` - ${c.value2}`}
                                </span>
                              );
                            })}
                            {trigger.conditions.length === 0 && (
                              <span className="text-gray-500 italic">No conditions</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No triggers configured
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Builder Modal */}
      {showBuilder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal header with tabs */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  {editingStrategy ? 'Edit Strategy' : 'Create Strategy'}
                </h2>
                <button
                  onClick={() => {
                    setShowBuilder(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Builder mode tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setBuilderMode('manual')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    builderMode === 'manual'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Filter className="w-4 h-4" /> Manual Builder
                </button>
                <button
                  onClick={() => setBuilderMode('ai-builder')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    builderMode === 'ai-builder'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Wand2 className="w-4 h-4" /> AI Builder
                </button>
                <button
                  onClick={() => setBuilderMode('ai-discovery')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    builderMode === 'ai-discovery'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Brain className="w-4 h-4" /> AI Discovery
                </button>
              </div>
            </div>

            {/* Modal content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* AI Builder Mode */}
              {builderMode === 'ai-builder' && (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <Wand2 className="w-16 h-16 mx-auto text-purple-400 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">AI Strategy Builder</h3>
                    <p className="text-gray-400 mb-6">
                      Describe your strategy in plain English and AI will generate the conditions
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Describe your strategy
                    </label>
                    <textarea
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      placeholder="e.g., Alert me when the home team is leading by 8+ points at halftime..."
                      className="w-full px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none resize-none"
                      rows={4}
                    />
                  </div>

                  <button
                    onClick={handleAIGenerate}
                    disabled={!aiPrompt || aiGenerating}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg"
                  >
                    {aiGenerating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" /> Generate Strategy
                      </>
                    )}
                  </button>

                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Example prompts:</h4>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li>• "Bet on home team when leading by 10+ at halftime"</li>
                      <li>• "Signal when Q3 lead is greater than Q1 lead"</li>
                      <li>• "Alert when underdog is winning in Q4"</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* AI Discovery Mode */}
              {builderMode === 'ai-discovery' && (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <Brain className="w-16 h-16 mx-auto text-purple-400 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">AI Pattern Discovery</h3>
                    <p className="text-gray-400 mb-6">
                      Analyze historical games to discover profitable betting patterns
                    </p>
                  </div>

                  <button
                    onClick={handleAIDiscovery}
                    disabled={discoveryRunning}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg"
                  >
                    {discoveryRunning ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Analyzing Historical Data...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5" /> Discover Patterns
                      </>
                    )}
                  </button>

                  {discoveredPatterns.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-green-400" />
                        Discovered Patterns
                      </h4>
                      {discoveredPatterns.map((pattern, i) => (
                        <div
                          key={i}
                          className="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">{pattern.pattern}</h5>
                            <span className="text-green-400 font-bold">
                              {pattern.winRate}% Win Rate
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mb-3">
                            Based on {pattern.sampleSize} historical games
                          </p>
                          <button
                            onClick={() => createFromPattern(pattern)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm"
                          >
                            <Plus className="w-4 h-4" /> Create Strategy
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Manual Builder Mode */}
              {builderMode === 'manual' && (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Strategy Name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                        placeholder="e.g., Halftime Lead Strategy"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none resize-none"
                        rows={2}
                        placeholder="Describe what this strategy does..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Trigger Mode</label>
                      <select
                        value={form.triggerMode}
                        onChange={e =>
                          setForm({
                            ...form,
                            triggerMode: e.target.value as 'sequential' | 'parallel',
                          })
                        }
                        className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600"
                      >
                        <option value="sequential">Sequential (all must match)</option>
                        <option value="parallel">Parallel (any can match)</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={form.isActive}
                        onChange={e => setForm({ ...form, isActive: e.target.checked })}
                        className="w-5 h-5 rounded"
                      />
                      <label htmlFor="isActive" className="text-sm font-medium">
                        Strategy Active
                      </label>
                    </div>
                  </div>

                  {/* Entry Conditions */}
                  <div className="bg-gray-700/30 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Zap className="w-5 h-5 text-green-400" />
                        Entry Conditions
                      </h3>
                      <span className="text-sm text-gray-400">
                        {form.entryConditions.length} condition(s)
                      </span>
                    </div>
                    {renderConditionEditor(form.entryConditions, 'entry')}
                  </div>

                  {/* Close Conditions */}
                  <div className="bg-gray-700/30 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Clock className="w-5 h-5 text-red-400" />
                          Close Conditions
                        </h3>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={form.hasAdvancedClose}
                            onChange={e =>
                              setForm({ ...form, hasAdvancedClose: e.target.checked })
                            }
                            className="w-4 h-4 rounded"
                          />
                          Advanced Close
                        </label>
                      </div>
                    </div>
                    {form.hasAdvancedClose ? (
                      renderConditionEditor(form.closeConditions, 'close')
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-4">
                        Enable Advanced Close to set custom close conditions
                      </p>
                    )}
                  </div>

                  {/* Rules */}
                  <div className="bg-gray-700/30 rounded-xl p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Filter className="w-5 h-5 text-blue-400" />
                      Rules
                    </h3>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <label className="flex items-center gap-2 p-3 bg-gray-700/50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.rules.firstHalfOnly}
                          onChange={e =>
                            setForm({
                              ...form,
                              rules: { ...form.rules, firstHalfOnly: e.target.checked, secondHalfOnly: false },
                            })
                          }
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">First Half Only</span>
                      </label>
                      <label className="flex items-center gap-2 p-3 bg-gray-700/50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.rules.secondHalfOnly}
                          onChange={e =>
                            setForm({
                              ...form,
                              rules: { ...form.rules, secondHalfOnly: e.target.checked, firstHalfOnly: false },
                            })
                          }
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">Second Half Only</span>
                      </label>
                      <label className="flex items-center gap-2 p-3 bg-gray-700/50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.rules.excludeOvertime}
                          onChange={e =>
                            setForm({
                              ...form,
                              rules: { ...form.rules, excludeOvertime: e.target.checked },
                            })
                          }
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">Exclude Overtime</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">
                          Specific Quarter
                        </label>
                        <select
                          value={form.rules.specificQuarter || ''}
                          onChange={e =>
                            setForm({
                              ...form,
                              rules: {
                                ...form.rules,
                                specificQuarter: e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              },
                            })
                          }
                          className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600"
                        >
                          <option value="">Any</option>
                          <option value="1">Q1</option>
                          <option value="2">Q2</option>
                          <option value="3">Q3</option>
                          <option value="4">Q4</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">
                          Stop At Time (min)
                        </label>
                        <input
                          type="number"
                          value={form.rules.stopAtTime || ''}
                          onChange={e =>
                            setForm({
                              ...form,
                              rules: {
                                ...form.rules,
                                stopAtTime: e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              },
                            })
                          }
                          className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600"
                          placeholder="e.g., 5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">
                          Min Combined Score
                        </label>
                        <input
                          type="number"
                          value={form.rules.minimumCombinedScore || ''}
                          onChange={e =>
                            setForm({
                              ...form,
                              rules: {
                                ...form.rules,
                                minimumCombinedScore: e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              },
                            })
                          }
                          className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600"
                          placeholder="e.g., 50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Win Requirements */}
                  <div className="bg-gray-700/30 rounded-xl p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-yellow-400" />
                      Win Requirements (for Backtesting)
                    </h3>
                    <div className="space-y-2">
                      {WIN_REQUIREMENTS.map(req => (
                        <label
                          key={req.value}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            form.winRequirement.type === req.value
                              ? 'bg-purple-600/20 border border-purple-500'
                              : 'bg-gray-700/50 border border-transparent hover:bg-gray-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="winRequirement"
                            checked={form.winRequirement.type === req.value}
                            onChange={() =>
                              setForm({
                                ...form,
                                winRequirement: { type: req.value as WinRequirement['type'] },
                              })
                            }
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{req.label}</span>
                          {req.value === 'final_lead_gte' &&
                            form.winRequirement.type === 'final_lead_gte' && (
                              <input
                                type="number"
                                value={form.winRequirement.value || ''}
                                onChange={e =>
                                  setForm({
                                    ...form,
                                    winRequirement: {
                                      type: 'final_lead_gte',
                                      value: parseInt(e.target.value) || 0,
                                    },
                                  })
                                }
                                className="w-20 px-2 py-1 bg-gray-700 rounded border border-gray-600 text-sm"
                                placeholder="Value"
                              />
                            )}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Discord Template */}
                  <div className="bg-gray-700/30 rounded-xl p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-indigo-400" />
                      Discord Message Template
                    </h3>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {DISCORD_VARIABLES.map(v => (
                        <button
                          key={v.key}
                          onClick={() =>
                            setForm({
                              ...form,
                              discordTemplate: form.discordTemplate + v.key,
                            })
                          }
                          className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                        >
                          {v.key}
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={form.discordTemplate}
                      onChange={e => setForm({ ...form, discordTemplate: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none font-mono text-sm resize-none"
                      rows={6}
                    />

                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-400">Live Preview</span>
                      </div>
                      {renderDiscordPreview()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowBuilder(false);
                  resetForm();
                }}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
              >
                Cancel
              </button>
              {builderMode === 'manual' && (
                <button
                  onClick={handleSaveStrategy}
                  disabled={!form.name}
                  className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg"
                >
                  <Save className="w-4 h-4" />
                  {editingStrategy ? 'Update Strategy' : 'Create Strategy'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
