// MAI Bets V3 - Discord Integration
import type { Signal, LiveGame, Strategy, StrategyTrigger } from '@/types';

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';

interface DiscordEmbed {
  title: string;
  description?: string;
  color: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: {
    text: string;
  };
  timestamp?: string;
}

interface DiscordMessage {
  content?: string;
  embeds?: DiscordEmbed[];
}

// Color constants (Discord uses decimal, not hex)
const COLORS = {
  GREEN: 0x00ff00,    // Win / Entry
  RED: 0xff0000,      // Loss
  YELLOW: 0xffff00,   // Warning / Active
  BLUE: 0x0099ff,     // Info
  PURPLE: 0x9b59b6,   // Special
  ORANGE: 0xff9900,   // Close
};

export async function sendDiscordMessage(message: DiscordMessage): Promise<boolean> {
  if (!DISCORD_WEBHOOK_URL) {
    console.error('Discord webhook URL not configured');
    return false;
  }

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error('Discord webhook failed:', response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Discord message:', error);
    return false;
  }
}

// ============================================
// Signal Notifications
// ============================================

export async function sendSignalEntryAlert(
  signal: Signal,
  game: LiveGame,
  strategy: Strategy,
  trigger: StrategyTrigger
): Promise<boolean> {
  const teamName = signal.team === 'home' ? game.home_team : game.away_team;
  const opposingTeam = signal.team === 'home' ? game.away_team : game.home_team;
  const lead = signal.team === 'home' ? game.home_lead : game.away_lead;

  const embed: DiscordEmbed = {
    title: `🚨 SIGNAL ENTRY: ${teamName}`,
    description: `**${strategy.name}** - ${trigger.name}`,
    color: COLORS.GREEN,
    fields: [
      {
        name: '🏀 Matchup',
        value: `${game.home_team} vs ${game.away_team}`,
        inline: true,
      },
      {
        name: '📊 Score',
        value: `${game.home_score} - ${game.away_score}`,
        inline: true,
      },
      {
        name: '⏱️ Quarter',
        value: `Q${game.quarter} - ${game.time_remaining}`,
        inline: true,
      },
      {
        name: '📈 Current Lead',
        value: `${teamName} ${lead > 0 ? '+' : ''}${lead}`,
        inline: true,
      },
      {
        name: '📉 Spread',
        value: `${signal.entry_spread > 0 ? '+' : ''}${signal.entry_spread}`,
        inline: true,
      },
      {
        name: '💰 Moneyline',
        value: `${signal.entry_moneyline > 0 ? '+' : ''}${signal.entry_moneyline}`,
        inline: true,
      },
    ],
    footer: {
      text: `MAI Bets V3 | Signal ID: ${signal.id}`,
    },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordMessage({ embeds: [embed] });
}

export async function sendSignalCloseAlert(
  signal: Signal,
  game: LiveGame,
  strategy: Strategy
): Promise<boolean> {
  const teamName = signal.team === 'home' ? game.home_team : game.away_team;
  const resultEmoji = signal.result === 'win' ? '✅' : signal.result === 'loss' ? '❌' : '➖';
  const resultColor = signal.result === 'win' ? COLORS.GREEN : signal.result === 'loss' ? COLORS.RED : COLORS.YELLOW;

  const embed: DiscordEmbed = {
    title: `${resultEmoji} SIGNAL CLOSED: ${teamName}`,
    description: `**${strategy.name}** - Result: **${signal.result?.toUpperCase()}**`,
    color: resultColor,
    fields: [
      {
        name: '🏀 Matchup',
        value: `${game.home_team} vs ${game.away_team}`,
        inline: true,
      },
      {
        name: '📊 Final Score',
        value: `${game.home_score} - ${game.away_score}`,
        inline: true,
      },
      {
        name: '📈 Entry Lead',
        value: `${signal.entry_lead > 0 ? '+' : ''}${signal.entry_lead}`,
        inline: true,
      },
      {
        name: '📉 Close Lead',
        value: `${signal.close_lead !== undefined ? (signal.close_lead > 0 ? '+' : '') + signal.close_lead : 'N/A'}`,
        inline: true,
      },
    ],
    footer: {
      text: `MAI Bets V3 | Signal ID: ${signal.id}`,
    },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordMessage({ embeds: [embed] });
}

// ============================================
// System Notifications
// ============================================

export async function sendSystemAlert(
  title: string,
  message: string,
  type: 'info' | 'warning' | 'error' = 'info'
): Promise<boolean> {
  const colorMap = {
    info: COLORS.BLUE,
    warning: COLORS.YELLOW,
    error: COLORS.RED,
  };

  const emojiMap = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '🚫',
  };

  const embed: DiscordEmbed = {
    title: `${emojiMap[type]} ${title}`,
    description: message,
    color: colorMap[type],
    footer: {
      text: 'MAI Bets V3 System',
    },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordMessage({ embeds: [embed] });
}

export async function sendDailySummary(
  totalSignals: number,
  wins: number,
  losses: number,
  pushes: number,
  profitLoss: string
): Promise<boolean> {
  const winRate = totalSignals > 0 ? ((wins / totalSignals) * 100).toFixed(1) : '0';

  const embed: DiscordEmbed = {
    title: '📊 Daily Summary',
    color: COLORS.PURPLE,
    fields: [
      {
        name: '📈 Total Signals',
        value: `${totalSignals}`,
        inline: true,
      },
      {
        name: '✅ Wins',
        value: `${wins}`,
        inline: true,
      },
      {
        name: '❌ Losses',
        value: `${losses}`,
        inline: true,
      },
      {
        name: '➖ Pushes',
        value: `${pushes}`,
        inline: true,
      },
      {
        name: '🎯 Win Rate',
        value: `${winRate}%`,
        inline: true,
      },
      {
        name: '💰 P/L',
        value: profitLoss,
        inline: true,
      },
    ],
    footer: {
      text: 'MAI Bets V3 | Daily Report',
    },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordMessage({ embeds: [embed] });
}

// ============================================
// Test Function
// ============================================

export async function testDiscordWebhook(): Promise<boolean> {
  return sendDiscordMessage({
    content: '🔔 MAI Bets V3 - Discord connection test successful!',
  });
}
