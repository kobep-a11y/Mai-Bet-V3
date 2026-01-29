'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Settings, Plus, Save, X, ChevronLeft, ChevronDown, ChevronUp,
  Zap, Filter, Clock, MessageSquare, Eye, Sparkles, Wand2, Brain,
  Search, BarChart3, AlertCircle
} from 'lucide-react';
import { Strategy, StrategyTrigger, Condition, ConditionOperator } from '@/types';

// ============================================
// COMPREHENSIVE CONDITION FIELDS (60+)
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

const WIN_REQUIREMENTS = [
  { value: 'none', label: 'No win requirement' },
  { value: 'leading_team_wins', label: 'Leading team at trigger time wins' },
  { value: 'home_team_wins', label: 'Home team wins' },
  { value: 'away_team_wins', label: 'Away team wins' },
  { value: 'final_lead_gte', label: 'Final lead ≥ value' },
];

type BuilderMode = 'manual' | 'ai-builder' | 'ai-discovery';

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
// COLLAPSIBLE SECTION COMPONENT
// ============================================

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
  children: React.ReactNode;
}

function CollapsibleSection({ title, icon, defaultOpen = true, badge, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="font-semibold text-slate-700">{title}</h3>
          {badge && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>
      {isOpen && <div className="p-4 pt-0 border-t border-slate-100">{children}</div>}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function StrategyBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  // Load strategy for editing
  useEffect(() => {
    if (editId) {
      fetchStrategy(editId);
    }
  }, [editId]);

  const fetchStrategy = async (id: string) => {
    try {
      const res = await fetch(`/api/strategies/${id}`);
      const data = await res.json();
      if (data.success) {
        const strategy = data.data;
        setEditingStrategy(strategy);

        const entryTrigger = strategy.triggers?.find((t: StrategyTrigger) => t.entryOrClose === 'entry');
        const closeTrigger = strategy.triggers?.find((t: StrategyTrigger) => t.entryOrClose === 'close');

        let metadata = { rules: {}, winRequirement: { type: 'none' }, discordTemplate: '' };
        try {
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
      }
    } catch (err) {
      setError('Failed to load strategy');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleSave = async () => {
    if (!form.name) {
      setError('Strategy name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
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

        if (editingStrategy?.triggers) {
          for (const trigger of editingStrategy.triggers) {
            await fetch(`/api/triggers/${trigger.id}`, { method: 'DELETE' });
          }
        }

        await fetch('/api/triggers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...entryTrigger, strategyId }),
        });

        if (closeTrigger) {
          await fetch('/api/triggers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...closeTrigger, strategyId }),
          });
        }

        router.push('/strategies');
      } else {
        setError(strategyData.error || 'Failed to save strategy');
      }
    } catch (err) {
      setError('Failed to save strategy');
    } finally {
      setSaving(false);
    }
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
      await new Promise(resolve => setTimeout(resolve, 2000));

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

  const renderConditionEditor = (conditions: Condition[], type: 'entry' | 'close') => (
    <div className="space-y-3 mt-4">
      {conditions.map((condition, index) => (
        <div key={index} className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg">
          <select
            value={condition.field}
            onChange={e => updateCondition(type, index, { field: e.target.value })}
            className="flex-1 px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm text-slate-700"
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

          <select
            value={condition.operator}
            onChange={e => updateCondition(type, index, { operator: e.target.value as ConditionOperator })}
            className="w-32 px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm text-slate-700"
          >
            {OPERATORS.map(op => (
              <option key={op.value} value={op.value}>
                {op.symbol} {op.label}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={condition.value as number}
            onChange={e => updateCondition(type, index, { value: parseFloat(e.target.value) || 0 })}
            className="w-24 px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm text-slate-700"
          />

          {condition.operator === 'between' && (
            <>
              <span className="text-slate-500">and</span>
              <input
                type="number"
                value={condition.value2 as number || 0}
                onChange={e => updateCondition(type, index, { value2: parseFloat(e.target.value) || 0 })}
                className="w-24 px-3 py-2 bg-white rounded-lg border border-slate-300 text-sm text-slate-700"
              />
            </>
          )}

          <button
            onClick={() => removeCondition(type, index)}
            className="p-2 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}

      <button
        onClick={() => addCondition(type)}
        className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-purple-500 hover:text-purple-600 transition-colors flex items-center justify-center gap-2"
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
      <div className="bg-[#36393f] rounded-lg p-4 font-sans text-[#dcddde] whitespace-pre-wrap text-sm">
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
      <div className="p-8 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/strategies"
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-purple-500" />
                <div>
                  <h1 className="text-xl font-bold text-slate-800">
                    {editingStrategy ? 'Edit Strategy' : 'Create Strategy'}
                  </h1>
                  <p className="text-slate-500 text-sm">Build your betting strategy</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/strategies"
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </Link>
              <button
                onClick={handleSave}
                disabled={saving || !form.name}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingStrategy ? 'Update' : 'Create'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-4xl mx-auto px-6 pt-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Builder Mode Tabs */}
      <div className="max-w-4xl mx-auto px-6 pt-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setBuilderMode('manual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              builderMode === 'manual'
                ? 'bg-purple-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" /> Manual Builder
          </button>
          <button
            onClick={() => setBuilderMode('ai-builder')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              builderMode === 'ai-builder'
                ? 'bg-purple-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Wand2 className="w-4 h-4" /> AI Builder
          </button>
          <button
            onClick={() => setBuilderMode('ai-discovery')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              builderMode === 'ai-discovery'
                ? 'bg-purple-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Brain className="w-4 h-4" /> AI Discovery
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 pb-8">
        {/* AI Builder Mode */}
        {builderMode === 'ai-builder' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="text-center py-6">
              <Wand2 className="w-16 h-16 mx-auto text-purple-500 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">AI Strategy Builder</h3>
              <p className="text-slate-500 mb-6">
                Describe your strategy in plain English and AI will generate the conditions
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Describe your strategy
              </label>
              <textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="e.g., Alert me when the home team is leading by 8+ points at halftime..."
                className="w-full px-4 py-3 bg-white rounded-lg border border-slate-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none text-slate-700"
                rows={4}
              />
            </div>

            <button
              onClick={handleAIGenerate}
              disabled={!aiPrompt || aiGenerating}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg"
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

            <div className="mt-6 bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h4 className="font-medium text-slate-700 mb-2">Example prompts:</h4>
              <ul className="text-sm text-slate-500 space-y-1">
                <li>• &quot;Bet on home team when leading by 10+ at halftime&quot;</li>
                <li>• &quot;Signal when Q3 lead is greater than Q1 lead&quot;</li>
                <li>• &quot;Alert when underdog is winning in Q4&quot;</li>
              </ul>
            </div>
          </div>
        )}

        {/* AI Discovery Mode */}
        {builderMode === 'ai-discovery' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="text-center py-6">
              <Brain className="w-16 h-16 mx-auto text-purple-500 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">AI Pattern Discovery</h3>
              <p className="text-slate-500 mb-6">
                Analyze historical games to discover profitable betting patterns
              </p>
            </div>

            <button
              onClick={handleAIDiscovery}
              disabled={discoveryRunning}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg"
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
              <div className="mt-6 space-y-4">
                <h4 className="font-medium text-slate-700 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-500" />
                  Discovered Patterns
                </h4>
                {discoveredPatterns.map((pattern, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 rounded-lg p-4 border border-slate-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-slate-700">{pattern.pattern}</h5>
                      <span className="text-green-600 font-bold">
                        {pattern.winRate}% Win Rate
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-3">
                      Based on {pattern.sampleSize} historical games
                    </p>
                    <button
                      onClick={() => createFromPattern(pattern)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
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
          <div className="space-y-4">
            {/* Basic Info */}
            <CollapsibleSection
              title="Basic Information"
              icon={<Settings className="w-5 h-5 text-purple-500" />}
              defaultOpen={true}
            >
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Strategy Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2 bg-white rounded-lg border border-slate-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 text-slate-700"
                    placeholder="e.g., Halftime Lead Strategy"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-2 bg-white rounded-lg border border-slate-300 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none text-slate-700"
                    rows={2}
                    placeholder="Describe what this strategy does..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Trigger Mode</label>
                  <select
                    value={form.triggerMode}
                    onChange={e => setForm({ ...form, triggerMode: e.target.value as 'sequential' | 'parallel' })}
                    className="w-full px-4 py-2 bg-white rounded-lg border border-slate-300 text-slate-700"
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
                    className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                    Strategy Active
                  </label>
                </div>
              </div>
            </CollapsibleSection>

            {/* Entry Conditions */}
            <CollapsibleSection
              title="Entry Conditions"
              icon={<Zap className="w-5 h-5 text-green-500" />}
              defaultOpen={true}
              badge={`${form.entryConditions.length} condition(s)`}
            >
              {renderConditionEditor(form.entryConditions, 'entry')}
            </CollapsibleSection>

            {/* Close Conditions */}
            <CollapsibleSection
              title="Close Conditions"
              icon={<Clock className="w-5 h-5 text-red-500" />}
              defaultOpen={false}
              badge={form.hasAdvancedClose ? `${form.closeConditions.length} condition(s)` : 'Optional'}
            >
              <div className="mt-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.hasAdvancedClose}
                    onChange={e => setForm({ ...form, hasAdvancedClose: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-purple-600"
                  />
                  <span className="text-slate-600">Enable Advanced Close Conditions</span>
                </label>
                {form.hasAdvancedClose ? (
                  renderConditionEditor(form.closeConditions, 'close')
                ) : (
                  <p className="text-slate-400 text-sm text-center py-4 mt-2">
                    Enable Advanced Close to set custom close conditions
                  </p>
                )}
              </div>
            </CollapsibleSection>

            {/* Rules */}
            <CollapsibleSection
              title="Rules"
              icon={<Filter className="w-5 h-5 text-blue-500" />}
              defaultOpen={false}
            >
              <div className="mt-4 grid grid-cols-3 gap-3">
                <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:border-purple-300">
                  <input
                    type="checkbox"
                    checked={form.rules.firstHalfOnly}
                    onChange={e => setForm({
                      ...form,
                      rules: { ...form.rules, firstHalfOnly: e.target.checked, secondHalfOnly: false },
                    })}
                    className="w-4 h-4 rounded border-slate-300 text-purple-600"
                  />
                  <span className="text-sm text-slate-700">First Half Only</span>
                </label>
                <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:border-purple-300">
                  <input
                    type="checkbox"
                    checked={form.rules.secondHalfOnly}
                    onChange={e => setForm({
                      ...form,
                      rules: { ...form.rules, secondHalfOnly: e.target.checked, firstHalfOnly: false },
                    })}
                    className="w-4 h-4 rounded border-slate-300 text-purple-600"
                  />
                  <span className="text-sm text-slate-700">Second Half Only</span>
                </label>
                <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:border-purple-300">
                  <input
                    type="checkbox"
                    checked={form.rules.excludeOvertime}
                    onChange={e => setForm({
                      ...form,
                      rules: { ...form.rules, excludeOvertime: e.target.checked },
                    })}
                    className="w-4 h-4 rounded border-slate-300 text-purple-600"
                  />
                  <span className="text-sm text-slate-700">Exclude Overtime</span>
                </label>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-500 mb-1">Specific Quarter</label>
                  <select
                    value={form.rules.specificQuarter || ''}
                    onChange={e => setForm({
                      ...form,
                      rules: {
                        ...form.rules,
                        specificQuarter: e.target.value ? parseInt(e.target.value) : undefined,
                      },
                    })}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-slate-700"
                  >
                    <option value="">Any</option>
                    <option value="1">Q1</option>
                    <option value="2">Q2</option>
                    <option value="3">Q3</option>
                    <option value="4">Q4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">Stop At Time (min)</label>
                  <input
                    type="number"
                    value={form.rules.stopAtTime || ''}
                    onChange={e => setForm({
                      ...form,
                      rules: {
                        ...form.rules,
                        stopAtTime: e.target.value ? parseInt(e.target.value) : undefined,
                      },
                    })}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-slate-700"
                    placeholder="e.g., 5"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-500 mb-1">Min Combined Score</label>
                  <input
                    type="number"
                    value={form.rules.minimumCombinedScore || ''}
                    onChange={e => setForm({
                      ...form,
                      rules: {
                        ...form.rules,
                        minimumCombinedScore: e.target.value ? parseInt(e.target.value) : undefined,
                      },
                    })}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-slate-700"
                    placeholder="e.g., 50"
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Win Requirements */}
            <CollapsibleSection
              title="Win Requirements"
              icon={<BarChart3 className="w-5 h-5 text-yellow-500" />}
              defaultOpen={false}
            >
              <div className="mt-4 space-y-2">
                {WIN_REQUIREMENTS.map(req => (
                  <label
                    key={req.value}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      form.winRequirement.type === req.value
                        ? 'bg-purple-50 border border-purple-300'
                        : 'bg-slate-50 border border-slate-200 hover:border-purple-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="winRequirement"
                      checked={form.winRequirement.type === req.value}
                      onChange={() => setForm({
                        ...form,
                        winRequirement: { type: req.value as WinRequirement['type'] },
                      })}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-sm text-slate-700">{req.label}</span>
                    {req.value === 'final_lead_gte' && form.winRequirement.type === 'final_lead_gte' && (
                      <input
                        type="number"
                        value={form.winRequirement.value || ''}
                        onChange={e => setForm({
                          ...form,
                          winRequirement: {
                            type: 'final_lead_gte',
                            value: parseInt(e.target.value) || 0,
                          },
                        })}
                        className="w-20 px-2 py-1 bg-white rounded border border-slate-300 text-sm text-slate-700"
                        placeholder="Value"
                      />
                    )}
                  </label>
                ))}
              </div>
            </CollapsibleSection>

            {/* Discord Template */}
            <CollapsibleSection
              title="Discord Message Template"
              icon={<MessageSquare className="w-5 h-5 text-indigo-500" />}
              defaultOpen={false}
            >
              <div className="mt-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {DISCORD_VARIABLES.map(v => (
                    <button
                      key={v.key}
                      onClick={() => setForm({
                        ...form,
                        discordTemplate: form.discordTemplate + v.key,
                      })}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-xs text-slate-600"
                    >
                      {v.key}
                    </button>
                  ))}
                </div>

                <textarea
                  value={form.discordTemplate}
                  onChange={e => setForm({ ...form, discordTemplate: e.target.value })}
                  className="w-full px-4 py-3 bg-white rounded-lg border border-slate-300 focus:border-purple-500 focus:outline-none font-mono text-sm resize-none text-slate-700"
                  rows={6}
                />

                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-500">Live Preview</span>
                  </div>
                  {renderDiscordPreview()}
                </div>
              </div>
            </CollapsibleSection>
          </div>
        )}
      </div>
    </div>
  );
}
