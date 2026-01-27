'use client';

import { useState } from 'react';
import { Settings, Database, MessageSquare, CheckCircle, XCircle, Loader2, Webhook } from 'lucide-react';

interface TestResult {
  success: boolean;
  message: string;
}

export default function SettingsPage() {
  const [airtableTest, setAirtableTest] = useState<TestResult | null>(null);
  const [discordTest, setDiscordTest] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  const testAirtable = async () => {
    setTesting('airtable');
    try {
      const response = await fetch('/api/strategies?action=test');
      const data = await response.json();

      setAirtableTest({
        success: data.data?.connected ?? false,
        message: data.data?.connected
          ? 'Connected to Airtable successfully!'
          : 'Failed to connect. Check API key and Base ID.',
      });
    } catch (error) {
      setAirtableTest({
        success: false,
        message: 'Connection error. Check your configuration.',
      });
    } finally {
      setTesting(null);
    }
  };

  const testDiscord = async () => {
    setTesting('discord');
    try {
      const response = await fetch('/api/webhook/test-discord', { method: 'POST' });
      const data = await response.json();

      setDiscordTest({
        success: data.success,
        message: data.success
          ? 'Test message sent to Discord!'
          : 'Failed to send. Check webhook URL.',
      });
    } catch (error) {
      setDiscordTest({
        success: false,
        message: 'Connection error. Check webhook URL.',
      });
    } finally {
      setTesting(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-mai-500" />
          Settings
        </h1>
        <p className="text-gray-400 mt-1">
          Configure and test your integrations
        </p>
      </div>

      <div className="grid gap-6">
        {/* Airtable Connection */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Database className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Airtable Connection</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Database for strategies, triggers, signals, and historical data
                </p>
              </div>
            </div>

            <button
              onClick={testAirtable}
              disabled={testing === 'airtable'}
              className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {testing === 'airtable' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Test Connection'
              )}
            </button>
          </div>

          {airtableTest && (
            <div
              className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                airtableTest.success
                  ? 'bg-green-500/10 border border-green-500/30'
                  : 'bg-red-500/10 border border-red-500/30'
              }`}
            >
              {airtableTest.success ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
              <span
                className={
                  airtableTest.success ? 'text-green-400' : 'text-red-400'
                }
              >
                {airtableTest.message}
              </span>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-2">
              Required Environment Variables
            </h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="bg-gray-900 p-2 rounded">
                <span className="text-mai-400">AIRTABLE_API_KEY</span>
                <span className="text-gray-500">=your_api_key</span>
              </div>
              <div className="bg-gray-900 p-2 rounded">
                <span className="text-mai-400">AIRTABLE_BASE_ID</span>
                <span className="text-gray-500">=your_base_id</span>
              </div>
            </div>
          </div>
        </div>

        {/* Discord Connection */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Discord Webhook</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Send signal alerts to your Discord channel
                </p>
              </div>
            </div>

            <button
              onClick={testDiscord}
              disabled={testing === 'discord'}
              className="px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {testing === 'discord' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Send Test'
              )}
            </button>
          </div>

          {discordTest && (
            <div
              className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                discordTest.success
                  ? 'bg-green-500/10 border border-green-500/30'
                  : 'bg-red-500/10 border border-red-500/30'
              }`}
            >
              {discordTest.success ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
              <span
                className={
                  discordTest.success ? 'text-green-400' : 'text-red-400'
                }
              >
                {discordTest.message}
              </span>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-2">
              Required Environment Variable
            </h3>
            <div className="bg-gray-900 p-2 rounded font-mono text-xs">
              <span className="text-mai-400">DISCORD_WEBHOOK_URL</span>
              <span className="text-gray-500">=https://discord.com/api/webhooks/...</span>
            </div>
          </div>
        </div>

        {/* Webhook Info */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Webhook className="w-6 h-6 text-green-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">N8N Webhook Endpoint</h2>
              <p className="text-sm text-gray-400 mt-1">
                Configure N8N to send game updates to this URL
              </p>

              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Single Game Update</p>
                  <code className="block bg-gray-900 p-2 rounded text-sm text-green-400">
                    POST /api/webhook/game-update
                  </code>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Batch Update</p>
                  <code className="block bg-gray-900 p-2 rounded text-sm text-green-400">
                    PUT /api/webhook/game-update
                  </code>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Example Payload</p>
                  <pre className="bg-gray-900 p-3 rounded text-xs text-gray-300 overflow-x-auto">
{`{
  "event_id": "12345",
  "league": "NBA2K",
  "home_team": "Lakers",
  "away_team": "Celtics",
  "home_score": 45,
  "away_score": 42,
  "quarter": 2,
  "time_remaining": "5:30",
  "status": "live",
  "odds": {
    "spread_home": -3.5,
    "spread_away": 3.5,
    "moneyline_home": -150,
    "moneyline_away": 130,
    "total_line": 185.5
  }
}`}
                  </pre>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700">
                <h3 className="text-sm font-medium text-gray-300 mb-2">
                  Optional: Webhook Authentication
                </h3>
                <div className="bg-gray-900 p-2 rounded font-mono text-xs">
                  <span className="text-mai-400">WEBHOOK_SECRET</span>
                  <span className="text-gray-500">=your_secret_token</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  If set, include header: <code className="text-mai-400">Authorization: Bearer your_secret_token</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
