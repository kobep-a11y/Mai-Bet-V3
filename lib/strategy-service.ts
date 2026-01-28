import Airtable from 'airtable';
import {
  Strategy,
  StrategyTrigger,
  Condition,
  DiscordWebhook,
  AirtableStrategyFields,
  AirtableTriggerFields,
} from '@/types';

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID || ''
);

// Cache strategies to avoid repeated API calls
let strategiesCache: Strategy[] | null = null;
let cacheExpiry: number = 0;
const CACHE_DURATION = 60000; // 1 minute cache

/**
 * Fetches all triggers from Airtable
 */
async function fetchTriggers(): Promise<Map<string, StrategyTrigger[]>> {
  try {
    const records = await base('Triggers').select().all();
    const triggersByStrategy = new Map<string, StrategyTrigger[]>();

    for (const record of records) {
      const fields = record.fields as unknown as AirtableTriggerFields;
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

    return triggersByStrategy;
  } catch (error) {
    console.error('Error fetching triggers:', error);
    return new Map();
  }
}

/**
 * Fetches all strategies with their triggers from Airtable
 */
export async function fetchStrategies(forceRefresh = false): Promise<Strategy[]> {
  // Return cached data if valid
  if (!forceRefresh && strategiesCache && Date.now() < cacheExpiry) {
    return strategiesCache;
  }

  try {
    // Fetch strategies and triggers in parallel
    const [strategyRecords, triggersByStrategy] = await Promise.all([
      base('Strategies').select().all(),
      fetchTriggers(),
    ]);

    const strategies: Strategy[] = strategyRecords.map((record) => {
      const fields = record.fields as unknown as AirtableStrategyFields;

      // Parse Discord webhooks from JSON string
      let discordWebhooks: DiscordWebhook[] = [];
      if (fields['Discord Webhooks']) {
        try {
          discordWebhooks = JSON.parse(fields['Discord Webhooks']);
        } catch {
          console.warn(`Failed to parse webhooks for strategy ${record.id}`);
        }
      }

      // Get triggers for this strategy
      const triggers = triggersByStrategy.get(record.id) || [];

      return {
        id: record.id,
        name: fields.Name || 'Unnamed Strategy',
        description: fields.Description || '',
        triggerMode: fields['Trigger Mode'] || 'sequential',
        isActive: fields['Is Active'] || false,
        triggers: triggers.sort((a, b) => a.order - b.order),
        discordWebhooks,
        createdAt: (record as unknown as { _rawJson: { createdTime: string } })._rawJson?.createdTime || '',
        updatedAt: new Date().toISOString(),
      };
    });

    // Update cache
    strategiesCache = strategies;
    cacheExpiry = Date.now() + CACHE_DURATION;

    console.log(`Loaded ${strategies.length} strategies with ${Array.from(triggersByStrategy.values()).flat().length} total triggers`);
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
  return strategies.filter((s) => s.isActive);
}

/**
 * Gets a single strategy by ID
 */
export async function getStrategy(id: string): Promise<Strategy | null> {
  const strategies = await fetchStrategies();
  return strategies.find((s) => s.id === id) || null;
}

/**
 * Creates a new strategy
 */
export async function createStrategy(data: {
  name: string;
  description?: string;
  triggerMode?: 'sequential' | 'parallel';
  isActive?: boolean;
  discordWebhooks?: DiscordWebhook[];
}): Promise<Strategy | null> {
  try {
    const record = await base('Strategies').create({
      Name: data.name,
      Description: data.description || '',
      'Trigger Mode': data.triggerMode || 'sequential',
      'Is Active': data.isActive || false,
      'Discord Webhooks': data.discordWebhooks ? JSON.stringify(data.discordWebhooks) : undefined,
    } as Partial<AirtableStrategyFields>);

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
 * Updates a strategy
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

    await base('Strategies').update(id, updateFields);

    // Invalidate cache
    strategiesCache = null;

    return true;
  } catch (error) {
    console.error('Error updating strategy:', error);
    return false;
  }
}

/**
 * Creates a new trigger for a strategy
 */
export async function createTrigger(data: {
  strategyId: string;
  name: string;
  conditions: Condition[];
  order?: number;
  entryOrClose?: 'entry' | 'close';
}): Promise<StrategyTrigger | null> {
  try {
    const record = await base('Triggers').create({
      Name: data.name,
      Strategy: [data.strategyId],
      Conditions: JSON.stringify(data.conditions),
      Order: data.order || 0,
      'Entry Or Close': data.entryOrClose || 'entry',
    } as Partial<AirtableTriggerFields>);

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
