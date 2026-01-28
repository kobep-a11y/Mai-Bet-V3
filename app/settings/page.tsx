'use client';

import { useState } from 'react';
import { Cog, Database, MessageSquare, Webhook, CheckCircle, XCircle } from 'lucide-react';

export default function SettingsPage() {
  const [airtableStatus, setAirtableStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [discordStatus, setDiscordStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const testAirtable = async () => {
    setAirtableStatus('testing');
    try {
      const res = await fetch('/api/strategies');
      const data = await res.json();
      setAirtableStatus(data.success ? 'success' : 'error');
    } catch {
      setAirtableStatus('error');
    }
  };

  const testDiscord = async () => {
    setDiscordStatus('testing');
    try {
      const res = await fetch('/api/discord/test', { method: 'POST' });
      const data = await res.json();
      setDiscordStatus(data.success ? 'success' : 'error');
    } catch {
      setDiscordStatus('error');
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'testing') return <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />;
    if (status === 'success') return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (status === 'error') return <XCircle className="w-4 h-4 text-red-400" />;
    return null;
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Cog className="w-8 h-8 text-gray-400" />
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-400 text-sm">Configure and test your integrations</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Airtable */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-yellow-400" />
              <div>
                <h3 className="font-semibold">Airtable Connection</h3>
                <p className="text-sm text-gray-400">Database for strategies, triggers, signals, and historical data</p>
              </div>
            </div>
            <button
              onClick={testAirtable}
              disabled={airtableStatus === 'testing'}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 rounded-lg transition-colors disabled:opacity-50"
            >
              <StatusIcon status={airtableStatus} />
              Test Connection
            </button>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 text-sm font-mono">
            <p className="text-gray-400">AIRTABLE_API_KEY=<span className="text-gray-600">your_api_key</span></p>
            <p className="text-gray-400">AIRTABLE_BASE_ID=<span className="text-gray-600">your_base_id</span></p>
          </div>
        </div>

        {/* Discord */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-indigo-400" />
              <div>
                <h3 className="font-semibold">Discord Webhook</h3>
                <p className="text-sm text-gray-400">Send signal alerts to your Discord channel</p>
              </div>
            </div>
            <button
              onClick={testDiscord}
              disabled={discordStatus === 'testing'}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded-lg transition-colors disabled:opacity-50"
            >
              <StatusIcon status={discordStatus} />
              Send Test
            </button>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 text-sm font-mono">
            <p className="text-gray-400">DISCORD_WEBHOOK_URL=<span className="text-gray-600">https://discord.com/api/webhooks/...</span></p>
          </div>
        </div>

        {/* N8N Webhook */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Webhook className="w-6 h-6 text-orange-400" />
            <div>
              <h3 className="font-semibold">N8N Webhook Endpoint</h3>
              <p className="text-sm text-gray-400">Configure N8N to send game updates to this URL</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">Single Game Update</p>
              <div className="bg-gray-900 rounded-lg p-3 text-sm font-mono">
                <span className="text-green-400">POST</span> <span className="text-gray-300">/api/webhook/game-update</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Batch Update</p>
              <div className="bg-gray-900 rounded-lg p-3 text-sm font-mono">
                <span className="text-blue-400">PUT</span> <span className="text-gray-300">/api/webhook/game-update</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
