import {
  Signal,
  Strategy,
  DiscordWebhook,
  TriggerEvaluationResult,
  LiveGame,
  TemplateContext,
  MessageTemplate,
  MessageTemplateType,
} from '@/types';
import {
  sendBetAvailableSMS,
  sendGameResultSMS,
  sendBlowoutSMS,
  isSMSConfigured,
} from './sms-service';

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

// ============================================
// MESSAGE TEMPLATE SYSTEM
// ============================================

/**
 * Maps camelCase context keys to snake_case placeholder names
 */
const PLACEHOLDER_MAP: Record<string, keyof TemplateContext> = {
  home_team: 'homeTeam',
  away_team: 'awayTeam',
  home_player: 'homePlayer',
  away_player: 'awayPlayer',
  winning_team: 'winningTeam',
  losing_team: 'losingTeam',
  leading_team: 'leadingTeam',
  trailing_team: 'trailingTeam',
  bet_team: 'betTeam',
  bet_player: 'betPlayer',
  home_score: 'homeScore',
  away_score: 'awayScore',
  total_score: 'totalScore',
  current_lead: 'currentLead',
  trigger_lead: 'triggerLead',
  final_lead: 'finalLead',
  quarter: 'quarter',
  game_time: 'gameTime',
  status: 'status',
  game_id: 'gameId',
  strategy_name: 'strategyName',
  trigger_name: 'triggerName',
  signal_id: 'signalId',
  home_spread: 'homeSpread',
  away_spread: 'awaySpread',
  spread: 'spread',
  total_line: 'totalLine',
  trigger_home_spread: 'triggerHomeSpread',
  trigger_away_spread: 'triggerAwaySpread',
  required_spread: 'requiredSpread',
  entry_spread: 'entrySpread',
  home_ml: 'homeMl',
  away_ml: 'awayMl',
  leading_team_spread: 'leadingTeamSpread',
  trailing_team_spread: 'trailingTeamSpread',
  result: 'result',
};

/**
 * Format a numeric value with sign prefix for spreads
 */
function formatSpread(value: number | undefined | null): string {
  if (value === undefined || value === null) return 'N/A';
  return value > 0 ? `+${value}` : `${value}`;
}

/**
 * Get result emoji based on result type
 */
function getResultEmoji(result: 'win' | 'loss' | 'push' | undefined): string {
  if (result === 'win') return '✅';
  if (result === 'loss') return '❌';
  if (result === 'push') return '➖';
  return '';
}

/**
 * Formats a message template by replacing placeholders with actual values
 *
 * @param template - The template string with {placeholder} tokens
 * @param context - The context object containing values for each placeholder
 * @returns The formatted message with placeholders replaced
 *
 * @example
 * formatMessageTemplate(
 *   "BET ON {bet_player} - {away_team} @ {home_team} - Score: {score_display}",
 *   { betPlayer: "KJMR", awayTeam: "Lakers (HYPER)", homeTeam: "OKC Thunder (KJMR)", awayScore: 45, homeScore: 52 }
 * )
 * // Returns: "BET ON KJMR - Lakers (HYPER) @ OKC Thunder (KJMR) - Score: 45 - 52"
 */
export function formatMessageTemplate(template: string, context: TemplateContext): string {
  // Match all {placeholder} patterns
  return template.replace(/\{([a-z_]+)\}/gi, (match, placeholder: string) => {
    const normalizedPlaceholder = placeholder.toLowerCase();

    // Special computed placeholders
    if (normalizedPlaceholder === 'score_display') {
      const away = context.awayScore ?? 0;
      const home = context.homeScore ?? 0;
      return `${away} - ${home}`;
    }

    if (normalizedPlaceholder === 'result_emoji') {
      return getResultEmoji(context.result);
    }

    // Format spread values with sign prefix
    if (normalizedPlaceholder.includes('spread') || normalizedPlaceholder === 'spread') {
      const contextKey = PLACEHOLDER_MAP[normalizedPlaceholder];
      if (contextKey) {
        const value = context[contextKey];
        if (typeof value === 'number') {
          return formatSpread(value);
        }
      }
      return 'N/A';
    }

    // Standard placeholder lookup
    const contextKey = PLACEHOLDER_MAP[normalizedPlaceholder];
    if (contextKey) {
      const value = context[contextKey];
      if (value !== undefined && value !== null) {
        return String(value);
      }
    }

    // Return original placeholder if not found (graceful fallback)
    console.warn(`Template placeholder not found: ${placeholder}`);
    return match;
  });
}

/**
 * Builds a TemplateContext from signal, strategy, game, and result data
 * This consolidates all available data into a single context object for template rendering
 */
export function buildTemplateContext(
  signal: Signal,
  strategy: Strategy,
  game: LiveGame,
  result?: 'win' | 'loss' | 'push'
): TemplateContext {
  const homePlayer = extractPlayerName(game.homeTeam);
  const awayPlayer = extractPlayerName(game.awayTeam);

  // Determine leading/trailing teams
  const homeLeading = game.homeScore > game.awayScore;
  const leadingTeam = homeLeading ? game.homeTeam : game.awayTeam;
  const trailingTeam = homeLeading ? game.awayTeam : game.homeTeam;
  const leadingPlayer = homeLeading ? homePlayer : awayPlayer;
  const trailingPlayer = homeLeading ? awayPlayer : homePlayer;

  // Determine bet side from strategy
  const betSide = strategy.oddsRequirement?.betSide || 'leading_team';
  let betTeam: string;
  let betPlayer: string;

  if (betSide === 'leading_team') {
    betTeam = leadingTeam;
    betPlayer = leadingPlayer;
  } else if (betSide === 'trailing_team') {
    betTeam = trailingTeam;
    betPlayer = trailingPlayer;
  } else if (betSide === 'home') {
    betTeam = game.homeTeam;
    betPlayer = homePlayer;
  } else {
    betTeam = game.awayTeam;
    betPlayer = awayPlayer;
  }

  // Calculate current lead
  const currentLead = Math.abs(game.homeScore - game.awayScore);

  // Determine final scores if game is finished
  const finalHomeScore = game.finalScores?.home || game.homeScore;
  const finalAwayScore = game.finalScores?.away || game.awayScore;
  const finalLead = Math.abs(finalHomeScore - finalAwayScore);

  // Determine winner/loser for result context
  let winningTeam: string | undefined;
  let losingTeam: string | undefined;
  if (finalHomeScore !== finalAwayScore) {
    winningTeam = finalHomeScore > finalAwayScore ? game.homeTeam : game.awayTeam;
    losingTeam = finalHomeScore > finalAwayScore ? game.awayTeam : game.homeTeam;
  }

  // Calculate leading team spread
  const leadingTeamSpread = homeLeading ? game.spread : -game.spread;
  const trailingTeamSpread = homeLeading ? -game.spread : game.spread;

  return {
    // Team/Player
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    homePlayer,
    awayPlayer,
    winningTeam,
    losingTeam,
    leadingTeam,
    trailingTeam,
    betTeam,
    betPlayer,
    // Scores
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    totalScore: game.homeScore + game.awayScore,
    currentLead,
    triggerLead: signal.leadMarginAtTrigger || Math.abs(signal.homeScore - signal.awayScore),
    finalLead,
    // Game State
    quarter: game.quarter,
    gameTime: game.timeRemaining,
    status: game.status,
    gameId: game.eventId,
    // Strategy/Trigger
    strategyName: strategy.name,
    triggerName: signal.triggerName,
    signalId: signal.id,
    // Odds
    homeSpread: game.spread,
    awaySpread: -game.spread,
    spread: game.spread,
    totalLine: game.total,
    triggerHomeSpread: signal.entrySpread,
    triggerAwaySpread: signal.entrySpread ? -signal.entrySpread : undefined,
    requiredSpread: strategy.oddsRequirement?.value || signal.requiredSpread,
    entrySpread: signal.actualSpreadAtEntry || signal.entrySpread,
    homeMl: game.mlHome,
    awayMl: game.mlAway,
    leadingTeamSpread,
    trailingTeamSpread,
    // Results
    result,
  };
}

/**
 * Gets a custom message template from strategy, or returns undefined for default handling
 */
export function getStrategyTemplate(
  strategy: Strategy,
  templateType: MessageTemplateType
): MessageTemplate | undefined {
  return strategy.messageTemplates?.find((t) => t.type === templateType);
}

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

  // Also send SMS alerts if configured
  if (isSMSConfigured()) {
    try {
      // Build a partial template context from signal data
      const partialContext: TemplateContext = {
        homeTeam: signal.homeTeam,
        awayTeam: signal.awayTeam,
        homePlayer: extractPlayerName(signal.homeTeam),
        awayPlayer: extractPlayerName(signal.awayTeam),
        betPlayer: extractPlayerName(signal.leadingTeamAtTrigger === 'home' ? signal.homeTeam : signal.awayTeam),
        homeScore: signal.homeScore,
        awayScore: signal.awayScore,
        currentLead,
        quarter: signal.quarter,
        gameTime: signal.timeRemaining,
        strategyName: signal.strategyName,
        signalId: signal.id,
      };
      const smsSent = await sendBlowoutSMS(strategy.id, partialContext, strategy);
      if (smsSent > 0) {
        console.log(`📱 Sent ${smsSent} SMS Blowout alerts`);
      }
    } catch (error) {
      console.error('Failed to send SMS blowout alerts:', error);
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

/**
 * Extract player name from team name
 * e.g., "OKC Thunder (KJMR)" -> "KJMR"
 */
function extractPlayerName(teamName: string): string {
  const match = teamName.match(/\(([^)]+)\)/);
  return match ? match[1] : teamName;
}

/**
 * Get team emoji based on context
 */
function getTeamEmoji(isLeading: boolean): string {
  return isLeading ? '🟢' : '🔴';
}

/**
 * Sends a bet available alert when odds align
 * This is the PRIMARY notification users see - when a bet becomes actionable
 * Supports custom message templates per strategy
 */
export async function sendBetAvailableAlert(
  signal: Signal,
  strategy: Strategy,
  game: LiveGame
): Promise<number> {
  // Build template context with all available data
  const context = buildTemplateContext(signal, strategy, game);

  // Check for custom template
  const customTemplate = getStrategyTemplate(strategy, 'bet_available');

  let message: DiscordMessage;

  if (customTemplate && customTemplate.format === 'text') {
    // Use custom text template (no embed)
    const formattedMessage = formatMessageTemplate(customTemplate.template, context);
    message = {
      content: formattedMessage,
      embeds: [],
    };
  } else if (customTemplate && customTemplate.format === 'embed') {
    // Custom template for embed title/description
    const formattedTitle = formatMessageTemplate(customTemplate.template, context);
    const embed: DiscordEmbed = {
      title: formattedTitle,
      description: `**${strategy.name}**`,
      color: COLORS.signal,
      fields: [
        { name: '👤 Bet On', value: `${context.betPlayer} (${context.betTeam?.split(' (')[0] || ''})`, inline: false },
        { name: '🏀 Matchup', value: `${context.awayPlayer} @ ${context.homePlayer}`, inline: true },
        { name: '📊 Score', value: `${context.awayScore} - ${context.homeScore}`, inline: true },
        { name: '📈 Current Gap', value: `${context.currentLead} pts`, inline: true },
        { name: '⏱️ Quarter', value: `Q${context.quarter}`, inline: true },
        { name: '⏰ Time', value: context.gameTime || '', inline: true },
        { name: '📉 Spread', value: formatSpread(context.spread), inline: true },
        { name: '✅ Required', value: `${context.requiredSpread} or better`, inline: true },
      ],
      footer: { text: `Signal: ${context.signalId} | Game: ${context.gameId}` },
      timestamp: new Date().toISOString(),
    };
    message = {
      content: `🚨 **BET AVAILABLE** - ${getTeamEmoji(true)} ${context.betPlayer}`,
      embeds: [embed],
    };
  } else {
    // Default embed format (original behavior)
    const embed: DiscordEmbed = {
      title: `🎰 BetSlip Available`,
      description: `**${strategy.name}**`,
      color: COLORS.signal,
      fields: [
        { name: '👤 Bet On', value: `${context.betPlayer} (${context.betTeam?.split(' (')[0] || ''})`, inline: false },
        { name: '🏀 Matchup', value: `${context.awayPlayer} @ ${context.homePlayer}`, inline: true },
        { name: '📊 Score', value: `${context.awayScore} - ${context.homeScore}`, inline: true },
        { name: '📈 Current Gap', value: `${context.currentLead} pts`, inline: true },
        { name: '⏱️ Quarter', value: `Q${context.quarter}`, inline: true },
        { name: '⏰ Time', value: context.gameTime || '', inline: true },
        { name: '📉 Spread', value: formatSpread(context.spread), inline: true },
        { name: '✅ Required', value: `${context.requiredSpread} or better`, inline: true },
      ],
      footer: { text: `Signal: ${context.signalId} | Game: ${context.gameId}` },
      timestamp: new Date().toISOString(),
    };
    message = {
      content: `🚨 **BET AVAILABLE** - ${getTeamEmoji(true)} ${context.betPlayer}`,
      embeds: [embed],
    };
  }

  // Send to all active webhooks for this strategy
  let sent = 0;
  const webhooks = [...(strategy.discordWebhooks || [])];

  // Include default webhook if configured
  const defaultWebhook = process.env.DISCORD_WEBHOOK_URL;
  if (defaultWebhook && !webhooks.some((w) => w.url === defaultWebhook)) {
    webhooks.push({ url: defaultWebhook, name: 'Default', isActive: true });
  }

  for (const webhook of webhooks) {
    if (webhook.isActive && webhook.url) {
      const success = await sendWebhookMessage(webhook.url, message);
      if (success) {
        sent++;
        console.log(`✅ Bet Available alert sent to: ${webhook.name}`);
      }
    }
  }

  // Also send SMS alerts if configured
  if (isSMSConfigured()) {
    try {
      const smsSent = await sendBetAvailableSMS(strategy.id, context, strategy);
      if (smsSent > 0) {
        console.log(`📱 Sent ${smsSent} SMS Bet Available alerts`);
      }
    } catch (error) {
      console.error('Failed to send SMS alerts:', error);
    }
  }

  return sent;
}

/**
 * Sends game result alert when game ends
 * Shows final outcome: WIN/LOSS/PUSH for the bet
 * Supports custom message templates per strategy
 */
export async function sendGameResultAlert(
  signal: Signal,
  strategy: Strategy,
  game: LiveGame,
  result: 'win' | 'loss' | 'push'
): Promise<number> {
  // Build template context with all available data
  const context = buildTemplateContext(signal, strategy, game, result);

  const resultEmoji = getResultEmoji(result);
  const resultText = result.toUpperCase();
  const resultColor = COLORS[result];

  // Calculate final scores
  const finalHomeScore = game.finalScores?.home || game.homeScore;
  const finalAwayScore = game.finalScores?.away || game.awayScore;

  // Check for custom template
  const customTemplate = getStrategyTemplate(strategy, 'game_result');

  let message: DiscordMessage;

  if (customTemplate && customTemplate.format === 'text') {
    // Use custom text template (no embed)
    const formattedMessage = formatMessageTemplate(customTemplate.template, context);
    message = {
      content: formattedMessage,
      embeds: [],
    };
  } else if (customTemplate && customTemplate.format === 'embed') {
    // Custom template for embed title/description
    const formattedTitle = formatMessageTemplate(customTemplate.template, context);
    const embed: DiscordEmbed = {
      title: formattedTitle,
      description: `**${strategy.name}**`,
      color: resultColor,
      fields: [
        { name: '👤 Bet On', value: context.betPlayer || '', inline: true },
        { name: '🏀 Matchup', value: `${context.awayPlayer} @ ${context.homePlayer}`, inline: true },
        { name: '📊 Final Score', value: `${finalAwayScore} - ${finalHomeScore}`, inline: true },
        { name: '📈 Entry Score', value: `${signal.awayScore} - ${signal.homeScore}`, inline: true },
        { name: '⏱️ Entry Time', value: `Q${signal.quarter} ${signal.timeRemaining}`, inline: true },
        { name: '📉 Entry Spread', value: formatSpread(context.entrySpread), inline: true },
      ],
      footer: { text: `Signal: ${context.signalId}` },
      timestamp: new Date().toISOString(),
    };
    message = {
      content: `${resultEmoji} **GAME RESULT: ${resultText}** - ${context.betPlayer}`,
      embeds: [embed],
    };
  } else {
    // Default embed format (original behavior)
    const embed: DiscordEmbed = {
      title: `${resultEmoji} Game Result: ${resultText}`,
      description: `**${strategy.name}**`,
      color: resultColor,
      fields: [
        { name: '👤 Bet On', value: context.betPlayer || '', inline: true },
        { name: '🏀 Matchup', value: `${context.awayPlayer} @ ${context.homePlayer}`, inline: true },
        { name: '📊 Final Score', value: `${finalAwayScore} - ${finalHomeScore}`, inline: true },
        { name: '📈 Entry Score', value: `${signal.awayScore} - ${signal.homeScore}`, inline: true },
        { name: '⏱️ Entry Time', value: `Q${signal.quarter} ${signal.timeRemaining}`, inline: true },
        { name: '📉 Entry Spread', value: formatSpread(context.entrySpread), inline: true },
      ],
      footer: { text: `Signal: ${context.signalId}` },
      timestamp: new Date().toISOString(),
    };
    message = {
      content: `${resultEmoji} **GAME RESULT: ${resultText}** - ${context.betPlayer}`,
      embeds: [embed],
    };
  }

  // Send to all active webhooks
  let sent = 0;
  const webhooks = [...(strategy.discordWebhooks || [])];

  const defaultWebhook = process.env.DISCORD_WEBHOOK_URL;
  if (defaultWebhook && !webhooks.some((w) => w.url === defaultWebhook)) {
    webhooks.push({ url: defaultWebhook, name: 'Default', isActive: true });
  }

  for (const webhook of webhooks) {
    if (webhook.isActive && webhook.url) {
      const success = await sendWebhookMessage(webhook.url, message);
      if (success) {
        sent++;
        console.log(`✅ Game Result alert sent to: ${webhook.name}`);
      }
    }
  }

  // Also send SMS alerts if configured
  if (isSMSConfigured()) {
    try {
      const smsSent = await sendGameResultSMS(strategy.id, context, strategy);
      if (smsSent > 0) {
        console.log(`📱 Sent ${smsSent} SMS Game Result alerts`);
      }
    } catch (error) {
      console.error('Failed to send SMS alerts:', error);
    }
  }

  return sent;
}
