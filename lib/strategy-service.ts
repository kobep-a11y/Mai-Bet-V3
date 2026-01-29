import {
  Strategy,
  StrategyTrigger,
  Condition,
  DiscordWebhook,
  OddsRequirement,
  BetSide,
  Rule,
  WinRequirement,
  AirtableStrategyFields,
  AirtableTriggerFields,
} from '@/types';

// Airtable REST API configuration
// Using REST API instead of SDK to avoid AbortSignal bug on Vercel serverless
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// Cache strategies to avoid repeated API calls
let strategiesCache: Strategy[] | null = null;
let cacheExpiry: number = 0;
const CACHE_DURATION = 60000; // 1 minute cache

/**
 * Helper function to make Airtable REST API requests
 * This avoids the AbortSignal bug in the Airtable SDK on Vercel
 */
async function airtableRequest(
  tableName: string,
  endpoint: string = '',
  options: RequestInit = {}
): Promise<Response> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}${endpoint}`;

  return fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

/**
 * Fetches all triggers from Airtable using REST API
 */
async function fetchTriggers(): Promise<Map<string, StrategyTrigger[]>> {
  try {
    const response = await airtableRequest('Triggers');

    if (!response.ok) {
      console.error('Failed to fetch triggers:', response.status, response.statusText);
      return new Map();
    }

    const data = await response.json();
    const records = data.records || [];
    const triggersByStrategy = new Map<string, StrategyTrigger[]>();

    for (const record of records) {
      const fields = record.fields as AirtableTriggerFields;
      const strategyIds = fields.Strategy || [];

      // Parse conditions from JSON string
      let conditions: Condition[] = [];
      if (fields.Conditions) {
        try {
          conditions = JSON.parse(fields.Conditions);
        } catch {
          console.warn(`Failed to parse conditions for trigger ${record.id}`);
        }
      }

      const trigger: StrategyTrigger = {
        id: record.id,
        strategyId: strategyIds[0] || '',
        name: fields.Name || 'Unnamed Trigger',
        conditions,
        order: fields.Order || 0,
        entryOrClose: fields['Entry Or Close'] || 'entry',
      };

      // Add trigger to each linked strategy
      for (const strategyId of strategyIds) {
        const existing = triggersByStrategy.get(strategyId) || [];
        existing.push(trigger);
        triggersByStrategy.set(strategyId, existing);
      }
    }

    console.log(`📋 Fetched ${records.length} triggers for ${triggersByStrategy.size} strategies`);
    return triggersByStrategy;
  } catch (error) {
    console.error('Error fetching triggers:', error);
    return new Map();
  }
}

/**
 * Fetches all strategies with their triggers from Airtable using REST API
 */
export async function fetchStrategies(forceRefresh = false): Promise<Strategy[]> {
  // Return cached data if valid
  if (!forceRefresh && strategiesCache && Date.now() < cacheExpiry) {
    return strategiesCache;
  }

  // Verify credentials
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('❌ Missing Airtable credentials for strategy fetch');
    return [];
  }

  try {
    // Fetch strategies and triggers in parallel
    const [strategiesResponse, triggersByStrategy] = await Promise.all([
      airtableRequest('Strategies'),
      fetchTriggers(),
    ]);

    if (!strategiesResponse.ok) {
      console.error('Failed to fetch strategies:', strategiesResponse.status, strategiesResponse.statusText);
      return [];
    }

    const data = await strategiesResponse.json();
    const strategyRecords = data.records || [];

    const strategies: Strategy[] = strategyRecords.map((record: { id: string; fields: AirtableStrategyFields; createdTime?: string }) => {
      const fields = record.fields;

      // Parse Discord webhooks from JSON string
      let discordWebhooks: DiscordWebhook[] = [];
      if (fields['Discord Webhooks']) {
        try {
          discordWebhooks = JSON.parse(fields['Discord Webhooks']);
        } catch {
          console.warn(`Failed to parse webhooks for strategy ${record.id}`);
        }
      }

      // Parse Rules from JSON string
      let rules: Rule[] | undefined;
      if (fields.Rules) {
        try {
          rules = JSON.parse(fields.Rules);
        } catch {
          console.warn(`Failed to parse rules for strategy ${record.id}`);
        }
      }

      // Parse Win Requirements from JSON string
      let winRequirements: WinRequirement[] | undefined;
      if (fields['Win Requirements']) {
        try {
          winRequirements = JSON.parse(fields['Win Requirements']);
        } catch {
          console.warn(`Failed to parse win requirements for strategy ${record.id}`);
        }
      }

      // Get triggers for this strategy
      const triggers = triggersByStrategy.get(record.id) || [];

      // Build odds requirement if present
      let oddsRequirement: OddsRequirement | undefined;
      if (fields['Odds Type'] && fields['Odds Value'] !== undefined) {
        oddsRequirement = {
          type: fields['Odds Type'],
          value: fields['Odds Value'],
          betSide: (fields['Bet Side'] as BetSide) || 'leading_team',
        };
      }

      // Determine if two-stage (has both entry and close triggers)
      const hasEntryTrigger = triggers.some((t) => t.entryOrClose === 'entry');
      const hasCloseTrigger = triggers.some((t) => t.entryOrClose === 'close');
      const isTwoStage = fields['Is Two Stage'] ?? (hasEntryTrigger && hasCloseTrigger);

      // Validate two-stage configuration
      if (isTwoStage && (!hasEntryTrigger || !hasCloseTrigger)) {
        console.warn(
          `⚠️ Strategy "${fields.Name}" is marked as two-stage but missing triggers:`,
          `Entry: ${hasEntryTrigger ? '✓' : '✗'}, Close: ${hasCloseTrigger ? '✓' : '✗'}`
        );
      }

      // Validate that strategy has at least one trigger if active
      if (fields['Is Active'] && triggers.length === 0) {
        console.warn(`⚠️ Active strategy "${fields.Name}" has no triggers configured`);
      }

      return {
        id: record.id,
        name: fields.Name || 'Unnamed Strategy',
        description: fields.Description || '',
        triggerMode: fields['Trigger Mode'] || 'sequential',
        isActive: fields['Is Active'] || false,
        triggers: triggers.sort((a, b) => a.order - b.order),
        discordWebhooks,
        oddsRequirement,
        rules,
        winRequirements,
        isTwoStage,
        expiryTimeQ4: fields['Expiry Time Q4'] || '2:20',
        createdAt: record.createdTime || '',
        updatedAt: new Date().toISOString(),
      };
    });

    // Update cache
    strategiesCache = strategies;
    cacheExpiry = Date.now() + CACHE_DURATION;

    const totalTriggers = Array.from(triggersByStrategy.values()).flat().length;
    const activeCount = strategies.filter(s => s.isActive).length;
    console.log(`✅ Loaded ${strategies.length} strategies (${activeCount} active) with ${totalTriggers} total triggers`);

    return strategies;
  } catch (error) {
    console.error('Error fetching strategies:', error);
    return [];
  }
}

/**
 * Gets only active strategies
 */
export async function getActiveStrategies(): Promise<Strategy[]> {
  const strategies = await fetchStrategies();
  const active = strategies.filter((s) => s.isActive);

  if (active.length === 0 && strategies.length > 0) {
    console.log(`⚠️ No active strategies found (${strategies.length} total strategies exist)`);
  }

  return active;
}

/**
 * Gets a single strategy by ID
 */
export async function getStrategy(id: string): Promise<Strategy | null> {
  const strategies = await fetchStrategies();
  return strategies.find((s) => s.id === id) || null;
}

/**
 * Creates a new strategy using REST API
 */
export async function createStrategy(data: {
  name: string;
  description?: string;
  triggerMode?: 'sequential' | 'parallel';
  isActive?: boolean;
  discordWebhooks?: DiscordWebhook[];
}): Promise<Strategy | null> {
  try {
    const response = await airtableRequest('Strategies', '', {
      method: 'POST',
      body: JSON.stringify({
        fields: {
          Name: data.name,
          Description: data.description || '',
          'Trigger Mode': data.triggerMode || 'sequential',
          'Is Active': data.isActive || false,
          'Discord Webhooks': data.discordWebhooks ? JSON.stringify(data.discordWebhooks) : undefined,
        },
      }),
    });

    if (!response.ok) {
      console.error('Failed to create strategy:', response.status);
      return null;
    }

    const record = await response.json();

    // Invalidate cache
    strategiesCache = null;

    return {
      id: record.id,
      name: data.name,
      description: data.description || '',
      triggerMode: data.triggerMode || 'sequential',
      isActive: data.isActive || false,
      triggers: [],
      discordWebhooks: data.discordWebhooks || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error creating strategy:', error);
    return null;
  }
}

/**
 * Updates a strategy using REST API
 */
export async function updateStrategy(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    triggerMode: 'sequential' | 'parallel';
    isActive: boolean;
    discordWebhooks: DiscordWebhook[];
  }>
): Promise<boolean> {
  try {
    const updateFields: Partial<AirtableStrategyFields> = {};
    if (data.name !== undefined) updateFields.Name = data.name;
    if (data.description !== undefined) updateFields.Description = data.description;
    if (data.triggerMode !== undefined) updateFields['Trigger Mode'] = data.triggerMode;
    if (data.isActive !== undefined) updateFields['Is Active'] = data.isActive;
    if (data.discordWebhooks !== undefined) {
      updateFields['Discord Webhooks'] = JSON.stringify(data.discordWebhooks);
    }

    const response = await airtableRequest('Strategies', `/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields: updateFields }),
    });

    if (!response.ok) {
      console.error('Failed to update strategy:', response.status);
      return false;
    }

    // Invalidate cache
    strategiesCache = null;

    return true;
  } catch (error) {
    console.error('Error updating strategy:', error);
    return false;
  }
}

/**
 * Creates a new trigger for a strategy using REST API
 */
export async function createTrigger(data: {
  strategyId: string;
  name: string;
  conditions: Condition[];
  order?: number;
  entryOrClose?: 'entry' | 'close';
}): Promise<StrategyTrigger | null> {
  try {
    const response = await airtableRequest('Triggers', '', {
      method: 'POST',
      body: JSON.stringify({
        fields: {
          Name: data.name,
          Strategy: [data.strategyId],
          Conditions: JSON.stringify(data.conditions),
          Order: data.order || 0,
          'Entry Or Close': data.entryOrClose || 'entry',
        },
      }),
    });

    if (!response.ok) {
      console.error('Failed to create trigger:', response.status);
      return null;
    }

    const record = await response.json();

    // Invalidate cache
    strategiesCache = null;

    return {
      id: record.id,
      strategyId: data.strategyId,
      name: data.name,
      conditions: data.conditions,
      order: data.order || 0,
      entryOrClose: data.entryOrClose || 'entry',
    };
  } catch (error) {
    console.error('Error creating trigger:', error);
    return null;
  }
}

/**
 * Clears the strategy cache
 */
export function clearCache(): void {
  strategiesCache = null;
  cacheExpiry = 0;
}
