'use client';

import { useState } from 'react';
import { Cog, Database, MessageSquare, Webhook, CheckCircle, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';

interface ConnectionResult {
  status: 'idle' | 'testing' | 'success' | 'error';
  message?: string;
  details?: string;
}

export default function SettingsPage() {
  const [airtableResult, setAirtableResult] = useState<ConnectionResult>({ status: 'idle' });
  const [discordResult, setDiscordResult] = useState<ConnectionResult>({ status: 'idle' });

  const testAirtable = async () => {
    setAirtableResult({ status: 'testing' });
    try {
      // Test the strategies endpoint which uses Airtable
      const res = await fetch('/api/strategies');
      const data = await res.json();

      if (data.success) {
        setAirtableResult({
          status: 'success',
          message: 'Connected successfully',
          details: `Found ${data.data?.length || 0} strategies in database`,
        });
      } else {
        setAirtableResult({
          status: 'error',
          message: 'Connection failed',
          details: data.error || 'Unable to fetch from Airtable',
        });
      }
    } catch (error) {
      setAirtableResult({
        status: 'error',
        message: 'Connection error',
        details: error instanceof Error ? error.message : 'Network error - check your configuration',
      });
    }
  };

  const testDiscord = async () => {
    setDiscordResult({ status: 'testing' });
    try {
      const res = await fetch('/api/discord/test', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setDiscordResult({
          status: 'success',
          message: 'Test message sent',
          details: 'Check your Discord channel for the test notification',
        });
      } else {
        setDiscordResult({
          status: 'error',
          message: 'Failed to send',
          details: data.error || 'Unable to send Discord message',
        });
      }
    } catch (error) {
      setDiscordResult({
        status: 'error',
        message: 'Connection error',
        details: error instanceof Error ? error.message : 'Network error - check webhook URL',
      });
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'testing') {
      return (
        <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      );
    }
    if (status === 'success') {
      return <CheckCircle className="w-5 h-5 text-emerald-400" />;
    }
    if (status === 'error') {
      return <XCircle className="w-5 h-5 text-red-400" />;
    }
    return <AlertTriangle className="w-5 h-5 text-gray-500" />;
  };

  const ResultBanner = ({ result }: { result: ConnectionResult }) => {
    if (result.status === 'idle' || result.status === 'testing') return null;

    return (
      <div
        className={`mt-4 p-4 rounded-lg border ${
          result.status === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}
      >
        <div className="flex items-center gap-2 font-medium">
          <StatusIcon status={result.status} />
          {result.message}
        </div>
        {result.details && (
          <p className="text-sm opacity-80 mt-1 ml-7">{result.details}</p>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-500/20 to-gray-600/20 flex items-center justify-center border border-gray-600/30">
          <Cog className="w-6 h-6 text-gray-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-gray-400">Configure and test your integrations</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Airtable Connection */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                <Database className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Airtable Connection</h3>
                <p className="text-sm text-gray-400">
                  Database for strategies, triggers, signals, and historical data
                </p>
              </div>
            </div>
            <button
              onClick={testAirtable}
              disabled={airtableResult.status === 'testing'}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 rounded-lg transition-all disabled:opacity-50 font-medium"
            >
              {airtableResult.status === 'testing' ? (
                <>
                  <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <StatusIcon status={airtableResult.status} />
                  Test Connection
                </>
              )}
            </button>
          </div>

          <ResultBanner result={airtableResult} />

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-gray-700/50">
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wider">API Key</span>
                <p className="text-sm font-mono text-gray-300">
                  {process.env.NEXT_PUBLIC_AIRTABLE_API_KEY
                    ? '••••••••' + process.env.NEXT_PUBLIC_AIRTABLE_API_KEY.slice(-8)
                    : 'Configured via environment variable'}
                </p>
              </div>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">ENV</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-gray-700/50">
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wider">Base ID</span>
                <p className="text-sm font-mono text-gray-300">
                  {process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID || 'Configured via environment variable'}
                </p>
              </div>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">ENV</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
            <ExternalLink className="w-3 h-3" />
            <a
              href="https://airtable.com/create/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-400 transition-colors"
            >
              Get your Airtable API key
            </a>
          </div>
        </div>

        {/* Discord Webhook */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30">
                <MessageSquare className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Discord Webhook</h3>
                <p className="text-sm text-gray-400">
                  Send signal alerts to your Discord channel
                </p>
              </div>
            </div>
            <button
              onClick={testDiscord}
              disabled={discordResult.status === 'testing'}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 border border-indigo-500/30 rounded-lg transition-all disabled:opacity-50 font-medium"
            >
              {discordResult.status === 'testing' ? (
                <>
                  <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <StatusIcon status={discordResult.status} />
                  Send Test
                </>
              )}
            </button>
          </div>

          <ResultBanner result={discordResult} />

          <div className="mt-6">
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-gray-700/50">
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wider">Webhook URL</span>
                <p className="text-sm font-mono text-gray-300">
                  {process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL
                    ? process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL.slice(0, 50) + '...'
                    : 'Configured via environment variable'}
                </p>
              </div>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">ENV</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
            <ExternalLink className="w-3 h-3" />
            <a
              href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-400 transition-colors"
            >
              Learn about Discord webhooks
            </a>
          </div>
        </div>

        {/* N8N Webhook Endpoints */}
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center border border-orange-500/30">
              <Webhook className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">N8N Webhook Endpoints</h3>
              <p className="text-sm text-gray-400">
                Configure N8N to send game updates to these URLs
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-black/20 rounded-lg border border-gray-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 uppercase tracking-wider">Single Game Update</span>
                <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded">POST</span>
              </div>
              <code className="text-sm font-mono text-emerald-400">
                /api/webhook/game-update
              </code>
              <p className="text-xs text-gray-400 mt-2">
                Send individual game data as it updates
              </p>
            </div>

            <div className="p-4 bg-black/20 rounded-lg border border-gray-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 uppercase tracking-wider">Batch Update</span>
                <span className="text-xs bg-sky-500/15 text-sky-400 px-2 py-0.5 rounded">PUT</span>
              </div>
              <code className="text-sm font-mono text-sky-400">
                /api/webhook/game-update
              </code>
              <p className="text-xs text-gray-400 mt-2">
                Send an array of game updates at once
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <p className="text-sm text-amber-400 font-medium">Auto-cleanup enabled</p>
                <p className="text-xs text-gray-400 mt-1">
                  Live games that don&apos;t receive updates for 20 seconds are automatically removed.
                  Finished games persist until manually cleared.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Expected Payload Format */}
        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-4">Expected Payload Format</h3>
          <div className="bg-black/30 rounded-lg p-4 font-mono text-xs overflow-x-auto border border-gray-700/50">
            <pre className="text-gray-300">
{`{
  "Event ID": "12345",
  "Home Team": "LA Lakers",
  "Away Team": "BOS Celtics",
  "Home Score ( API )": 58,
  "Away Score ( API )": 54,
  "Quarter": 3,
  "Time Minutes ( API )": 4,
  "Time Seconds ( API )": 30,
  "Quarter 1 Home": 22,
  "Quarter 1 Away": 18,
  "Quarter 2 Home": 16,
  "Quarter 2 Away": 20,
  "Quarter 3 Home": 20,
  "Quarter 3 Away": 16,
  "Quarter 4 Home": 0,
  "Quarter 4 Away": 0,
  "Halftime Score Home": 38,
  "Halftime Score Away": 38,
  "Home Team ID": "lakers-123",
  "Away Team ID": "celtics-456"
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
