import { Signal, Strategy, DiscordWebhook, TriggerEvaluationResult } from '@/types';

interface DiscordEmbed {
  title: string;
  description?: string;
  color: number;
  fields: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
}

interface DiscordMessage {
  content?: string;
  embeds: DiscordEmbed[];
}

// Color codes for Discord embeds
const COLORS = {
  signal: 0x00ff00, // Green - new signal
  close: 0xff9900, // Orange - signal closed
  win: 0x00ff00, // Green - win
  loss: 0xff0000, // Red - loss
  push: 0x808080, // Gray - push
  blowout: 0xff0000, // Red - blowout protection
  info: 0x0099ff, // Blue - info
};

/**
 * Sends a message to a Discord webhook
 */
async function sendWebhookMessage(webhookUrl: string, message: DiscordMessage): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error(`Discord webhook failed: ${response.status} ${response.statusText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Discord webhook:', error);
    return false;
  }
}

/**
 * Sends a signal alert to all active webhooks for a strategy
 */
export async function sendSignalAlert(
  signal: Signal,
  strategy: Strategy,
  result: TriggerEvaluationResult
): Promise<number> {
  const { trigger, game } = result;

  // Build the Discord embed
  const embed: DiscordEmbed = {
    title: `🚨 ${strategy.name} Signal`,
    description: `**${game.awayTeam}** @ **${game.homeTeam}**`,
    color: COLORS.signal,
    fields: [
      { name: '🎯 Trigger', value: trigger.name, inline: true },
      { name: '⏱️ Game Time', value: `Q${game.quarter} ${game.timeRemaining}`, inline: true },
      { name: '📊 Score', value: `${game.awayScore} - ${game.homeScore}`, inline: true },
      { name: '📈 Spread', value: `${game.spread > 0 ? '+' : ''}${game.spread}`, inline: true },
      { name: '📉 Total', value: `${game.total}`, inline: true },
      {
        name: '💰 Lead',
        value: `${Math.abs(game.homeScore - game.awayScore)} pts (${game.homeScore > game.awayScore ? 'Home' : 'Away'})`,
        inline: true,
      },
    ],
    footer: { text: `Signal ID: ${signal.id} | Game ID: ${game.eventId}` },
    timestamp: new Date().toISOString(),
  };

  const message: DiscordMessage = {
    content: `📢 **New Signal Alert**`,
    embeds: [embed],
  };

  // Send to all active webhooks for this strategy
  let sent = 0;
  const webhooks = strategy.discordWebhooks || [];

  // Also include the default webhook if configured
  const defaultWebhook = process.env.DISCORD_WEBHOOK_URL;
  if (defaultWebhook && !webhooks.some((w) => w.url === defaultWebhook)) {
    webhooks.push({ url: defaultWebhook, name: 'Default', isActive: true });
  }

  for (const webhook of webhooks) {
    if (webhook.isActive && webhook.url) {
      const success = await sendWebhookMessage(webhook.url, message);
      if (success) {
        sent++;
        console.log(`✅ Discord alert sent to: ${webhook.name}`);
      }
    }
  }

  return sent;
}

/**
 * Sends a signal close notification
 */
export async function sendSignalCloseAlert(
  signal: Signal,
  strategy: Strategy,
  result: 'win' | 'loss' | 'push'
): Promise<number> {
  const resultEmoji = result === 'win' ? '✅' : result === 'loss' ? '❌' : '➖';
  const resultText = result.toUpperCase();

  const embed: DiscordEmbed = {
    title: `${resultEmoji} Signal Closed - ${resultText}`,
    description: `**${signal.awayTeam}** @ **${signal.homeTeam}**`,
    color: COLORS[result],
    fields: [
      { name: '📋 Strategy', value: signal.strategyName, inline: true },
      { name: '🎯 Trigger', value: signal.triggerName, inline: true },
      { name: '📊 Final Score', value: `${signal.finalAwayScore || signal.awayScore} - ${signal.finalHomeScore || signal.homeScore}`, inline: true },
      { name: '📈 Entry Spread', value: `${signal.entrySpread}`, inline: true },
      { name: '📉 Entry Total', value: `${signal.entryTotal}`, inline: true },
      { name: '⏱️ Entry Time', value: `Q${signal.quarter} ${signal.timeRemaining}`, inline: true },
    ],
    footer: { text: `Signal ID: ${signal.id}` },
    timestamp: new Date().toISOString(),
  };

  const message: DiscordMessage = {
    content: `📊 **Signal Result: ${resultText}**`,
    embeds: [embed],
  };

  let sent = 0;
  const webhooks = strategy.discordWebhooks || [];

  const defaultWebhook = process.env.DISCORD_WEBHOOK_URL;
  if (defaultWebhook && !webhooks.some((w) => w.url === defaultWebhook)) {
    webhooks.push({ url: defaultWebhook, name: 'Default', isActive: true });
  }

  for (const webhook of webhooks) {
    if (webhook.isActive && webhook.url) {
      const success = await sendWebhookMessage(webhook.url, message);
      if (success) sent++;
    }
  }

  return sent;
}

/**
 * Sends a blowout protection alert
 */
export async function sendBlowoutAlert(
  signal: Signal,
  strategy: Strategy,
  currentLead: number
): Promise<number> {
  const embed: DiscordEmbed = {
    title: `⚠️ BLOWOUT PROTECTION`,
    description: `**${signal.awayTeam}** @ **${signal.homeTeam}**`,
    color: COLORS.blowout,
    fields: [
      { name: '📋 Strategy', value: signal.strategyName, inline: true },
      { name: '📊 Current Lead', value: `${currentLead} pts`, inline: true },
      { name: '⏱️ Entry Time', value: `Q${signal.quarter} ${signal.timeRemaining}`, inline: true },
      { name: '⚠️ Action', value: 'Consider closing position', inline: false },
    ],
    footer: { text: `Signal ID: ${signal.id}` },
    timestamp: new Date().toISOString(),
  };

  const message: DiscordMessage = {
    content: `🚨 **BLOWOUT WARNING**`,
    embeds: [embed],
  };

  let sent = 0;
  const webhooks = strategy.discordWebhooks || [];

  const defaultWebhook = process.env.DISCORD_WEBHOOK_URL;
  if (defaultWebhook) {
    webhooks.push({ url: defaultWebhook, name: 'Default', isActive: true });
  }

  for (const webhook of webhooks) {
    if (webhook.isActive && webhook.url) {
      const success = await sendWebhookMessage(webhook.url, message);
      if (success) sent++;
    }
  }

  return sent;
}

/**
 * Sends a test message to verify webhook configuration
 */
export async function sendTestMessage(webhookUrl: string): Promise<boolean> {
  const embed: DiscordEmbed = {
    title: '🧪 Test Message',
    description: 'MAI Bets V3 connection test successful!',
    color: COLORS.info,
    fields: [
      { name: 'Status', value: '✅ Connected', inline: true },
      { name: 'Timestamp', value: new Date().toLocaleString(), inline: true },
    ],
    footer: { text: 'MAI Bets V3' },
    timestamp: new Date().toISOString(),
  };

  const message: DiscordMessage = {
    content: '🔔 **MAI Bets V3 Test**',
    embeds: [embed],
  };

  return sendWebhookMessage(webhookUrl, message);
}

/**
 * Sends to multiple webhooks
 */
export async function sendToMultipleWebhooks(
  webhooks: DiscordWebhook[],
  message: DiscordMessage
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const webhook of webhooks) {
    if (webhook.isActive && webhook.url) {
      const success = await sendWebhookMessage(webhook.url, message);
      if (success) {
        sent++;
      } else {
        failed++;
      }
    }
  }

  return { sent, failed };
}
