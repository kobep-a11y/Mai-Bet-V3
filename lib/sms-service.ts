/**
 * SMS Service - Send SMS notifications via Twilio
 *
 * This service handles:
 * - Sending SMS messages via Twilio
 * - Rate limiting to prevent abuse
 * - Fetching SMS recipients and subscriptions from Airtable
 * - Formatting messages for SMS (shorter than Discord)
 *
 * Required Environment Variables:
 * - TWILIO_ACCOUNT_SID: Twilio account SID
 * - TWILIO_AUTH_TOKEN: Twilio auth token
 * - TWILIO_PHONE_NUMBER: Twilio phone number to send from
 * - AIRTABLE_API_KEY: Airtable API key (existing)
 * - AIRTABLE_BASE_ID: Airtable base ID (existing)
 */

import Airtable from 'airtable';
import { Strategy, TemplateContext } from '@/types';
import { formatMessageTemplate } from './discord-service';

// ============================================
// TYPES
// ============================================

export interface SMSRecipient {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

export interface SMSSubscription {
  id: string;
  recipientId: string;
  strategyId: string;
  alertTypes: SMSAlertType[];
  isActive: boolean;
}

export type SMSAlertType = 'bet_available' | 'game_result' | 'blowout';

interface AirtableSMSRecipientFields {
  Name: string;
  Phone: string;
  'Is Active'?: boolean;
}

interface AirtableSMSSubscriptionFields {
  Name?: string;
  'Recipient ID': string[];
  'Strategy ID': string[];
  'Alert Types'?: string; // JSON array of SMSAlertType
  'Is Active'?: boolean;
}

// ============================================
// RATE LIMITING
// ============================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Rate limit: 10 SMS per phone number per hour
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// In-memory rate limit tracking
const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Check if a phone number is rate limited
 */
function isRateLimited(phone: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(phone);

  if (!entry) {
    return false;
  }

  // Reset if window has passed
  if (now > entry.resetAt) {
    rateLimitMap.delete(phone);
    return false;
  }

  return entry.count >= RATE_LIMIT_MAX;
}

/**
 * Record an SMS send for rate limiting
 */
function recordSend(phone: string): void {
  const now = Date.now();
  const entry = rateLimitMap.get(phone);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(phone, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
  } else {
    entry.count++;
  }
}

// ============================================
// TWILIO INTEGRATION
// ============================================

/**
 * Get Twilio configuration from environment
 */
function getTwilioConfig(): { accountSid: string; authToken: string; fromNumber: string } | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('SMS: Twilio not configured. Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER');
    return null;
  }

  return { accountSid, authToken, fromNumber };
}

/**
 * Send an SMS via Twilio REST API
 * Uses native fetch instead of Twilio SDK to avoid additional dependencies
 */
export async function sendSMS(
  recipientPhone: string,
  message: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const config = getTwilioConfig();

  if (!config) {
    return { success: false, error: 'Twilio not configured' };
  }

  // Check rate limit
  if (isRateLimited(recipientPhone)) {
    console.warn(`SMS: Rate limited for ${recipientPhone}`);
    return { success: false, error: 'Rate limited' };
  }

  // Validate phone number format (basic validation)
  const cleanPhone = recipientPhone.replace(/\D/g, '');
  if (cleanPhone.length < 10 || cleanPhone.length > 15) {
    return { success: false, error: 'Invalid phone number format' };
  }

  // Format phone with + prefix if not present
  const formattedPhone = recipientPhone.startsWith('+') ? recipientPhone : `+1${cleanPhone}`;

  // Truncate message to SMS limit (160 chars for single SMS, we'll allow up to 320 for 2-segment)
  const truncatedMessage = message.slice(0, 320);

  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        To: formattedPhone,
        From: config.fromNumber,
        Body: truncatedMessage,
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`SMS: Twilio error ${response.status}: ${errorText}`);
      return { success: false, error: `Twilio error: ${response.status}` };
    }

    const result = await response.json();
    recordSend(recipientPhone);

    console.log(`SMS: Sent to ${formattedPhone}, SID: ${result.sid}`);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('SMS: Error sending message:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================
// AIRTABLE INTEGRATION
// ============================================

/**
 * Get Airtable base instance
 */
function getAirtableBase(): Airtable.Base | null {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    console.warn('SMS: Airtable not configured');
    return null;
  }

  return new Airtable({ apiKey }).base(baseId);
}

/**
 * Fetch all active SMS recipients from Airtable
 */
export async function getSMSRecipients(): Promise<SMSRecipient[]> {
  const base = getAirtableBase();
  if (!base) return [];

  try {
    const records = await base('SMS Recipients')
      .select({
        filterByFormula: "{Is Active} = TRUE()",
      })
      .all();

    return records.map((record) => {
      const fields = record.fields as unknown as AirtableSMSRecipientFields;
      return {
        id: record.id,
        name: fields.Name || '',
        phone: fields.Phone || '',
        isActive: fields['Is Active'] !== false,
        createdAt: record._rawJson?.createdTime || new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error('SMS: Error fetching recipients:', error);
    return [];
  }
}

/**
 * Fetch SMS subscriptions for a specific strategy
 */
export async function getSubscriptionsForStrategy(strategyId: string): Promise<SMSSubscription[]> {
  const base = getAirtableBase();
  if (!base) return [];

  try {
    const records = await base('SMS Subscriptions')
      .select({
        filterByFormula: `AND({Is Active} = TRUE(), FIND("${strategyId}", ARRAYJOIN({Strategy ID})))`,
      })
      .all();

    return records.map((record) => {
      const fields = record.fields as unknown as AirtableSMSSubscriptionFields;
      let alertTypes: SMSAlertType[] = ['bet_available', 'game_result'];

      if (fields['Alert Types']) {
        try {
          alertTypes = JSON.parse(fields['Alert Types']);
        } catch {
          // Use default
        }
      }

      return {
        id: record.id,
        recipientId: fields['Recipient ID']?.[0] || '',
        strategyId: fields['Strategy ID']?.[0] || '',
        alertTypes,
        isActive: fields['Is Active'] !== false,
      };
    });
  } catch (error) {
    console.error('SMS: Error fetching subscriptions:', error);
    return [];
  }
}

/**
 * Get a recipient by ID
 */
export async function getRecipientById(recipientId: string): Promise<SMSRecipient | null> {
  const base = getAirtableBase();
  if (!base) return null;

  try {
    const record = await base('SMS Recipients').find(recipientId);
    const fields = record.fields as unknown as AirtableSMSRecipientFields;

    return {
      id: record.id,
      name: fields.Name || '',
      phone: fields.Phone || '',
      isActive: fields['Is Active'] !== false,
      createdAt: record._rawJson?.createdTime || new Date().toISOString(),
    };
  } catch (error) {
    console.error('SMS: Error fetching recipient:', error);
    return null;
  }
}

// ============================================
// DEFAULT SMS TEMPLATES
// ============================================

const DEFAULT_SMS_TEMPLATES = {
  bet_available: 'MAI BET: {bet_player} {away_team}@{home_team} Q{quarter} {game_time} Score:{score_display} Spread:{spread}',
  game_result: 'MAI {result_emoji}{result}: {bet_player} Final:{score_display} Spread:{entry_spread}',
  blowout: 'MAI BLOWOUT: {bet_player} Lead:{current_lead}pts - Consider closing',
};

/**
 * Format SMS message using template context
 * Uses shorter format than Discord due to SMS character limits
 */
export function formatSMSMessage(
  alertType: SMSAlertType,
  context: TemplateContext,
  customTemplate?: string
): string {
  const template = customTemplate || DEFAULT_SMS_TEMPLATES[alertType];
  return formatMessageTemplate(template, context);
}

// ============================================
// HIGH-LEVEL SMS ALERT FUNCTIONS
// ============================================

/**
 * Send SMS alerts for a strategy to all subscribed recipients
 * Returns the number of SMS messages sent
 */
export async function sendSMSAlertForStrategy(
  strategyId: string,
  alertType: SMSAlertType,
  context: TemplateContext,
  strategy?: Strategy
): Promise<number> {
  // Check if SMS is configured
  const config = getTwilioConfig();
  if (!config) {
    return 0;
  }

  // Get subscriptions for this strategy
  const subscriptions = await getSubscriptionsForStrategy(strategyId);
  const relevantSubscriptions = subscriptions.filter((sub) => sub.alertTypes.includes(alertType));

  if (relevantSubscriptions.length === 0) {
    return 0;
  }

  // Get custom SMS template from strategy if available
  const customTemplate = strategy?.messageTemplates?.find(
    (t) => t.type === alertType && t.format === 'text'
  )?.template;

  // Format the message
  const message = formatSMSMessage(alertType, context, customTemplate);

  let sentCount = 0;

  // Send to each recipient
  for (const subscription of relevantSubscriptions) {
    const recipient = await getRecipientById(subscription.recipientId);

    if (!recipient || !recipient.isActive || !recipient.phone) {
      continue;
    }

    const result = await sendSMS(recipient.phone, message);
    if (result.success) {
      sentCount++;
      console.log(`SMS: Sent ${alertType} alert to ${recipient.name}`);
    }
  }

  return sentCount;
}

/**
 * Send a bet available SMS alert
 */
export async function sendBetAvailableSMS(
  strategyId: string,
  context: TemplateContext,
  strategy?: Strategy
): Promise<number> {
  return sendSMSAlertForStrategy(strategyId, 'bet_available', context, strategy);
}

/**
 * Send a game result SMS alert
 */
export async function sendGameResultSMS(
  strategyId: string,
  context: TemplateContext,
  strategy?: Strategy
): Promise<number> {
  return sendSMSAlertForStrategy(strategyId, 'game_result', context, strategy);
}

/**
 * Send a blowout warning SMS alert
 */
export async function sendBlowoutSMS(
  strategyId: string,
  context: TemplateContext,
  strategy?: Strategy
): Promise<number> {
  return sendSMSAlertForStrategy(strategyId, 'blowout', context, strategy);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if SMS is configured and ready to use
 */
export function isSMSConfigured(): boolean {
  return getTwilioConfig() !== null;
}

/**
 * Get rate limit status for a phone number
 */
export function getRateLimitStatus(phone: string): { limited: boolean; remaining: number; resetAt?: Date } {
  const now = Date.now();
  const entry = rateLimitMap.get(phone);

  if (!entry || now > entry.resetAt) {
    return { limited: false, remaining: RATE_LIMIT_MAX };
  }

  return {
    limited: entry.count >= RATE_LIMIT_MAX,
    remaining: Math.max(0, RATE_LIMIT_MAX - entry.count),
    resetAt: new Date(entry.resetAt),
  };
}
