/**
 * Recalculate Outcomes Service
 *
 * Provides utilities for recalculating signal outcomes:
 * - Batch recalculation when win requirement logic changes
 * - Recalculate specific signals by ID
 * - Recalculate signals within a date range
 */

import {
  Signal,
  Strategy,
  WinRequirement,
  OddsRequirement,
  AirtableSignalFields,
  AirtableHistoricalGameFields,
} from '@/types';

// Airtable REST API configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
  createdTime?: string;
}

interface RecalculateResult {
  signalId: string;
  signalName: string;
  previousResult?: 'win' | 'loss' | 'push';
  newResult: 'win' | 'loss' | 'push' | 'no_change' | 'error';
  reason?: string;
}

interface RecalculateSummary {
  success: boolean;
  timestamp: string;
  totalProcessed: number;
  changed: number;
  unchanged: number;
  errors: number;
  results: RecalculateResult[];
}

/**
 * Helper function to make Airtable REST API requests
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
 * Get a strategy by ID
 */
async function getStrategy(strategyId: string): Promise<Strategy | null> {
  try {
    const response = await airtableRequest('Strategies', `/${strategyId}`);
    if (!response.ok) return null;

    const record = await response.json();
    const fields = record.fields;

    // Parse webhooks
    let discordWebhooks = [];
    try {
      discordWebhooks = JSON.parse(fields['Discord Webhooks'] || '[]');
    } catch {
      discordWebhooks = [];
    }

    // Parse rules
    let rules = [];
    try {
      rules = JSON.parse(fields['Rules'] || '[]');
    } catch {
      rules = [];
    }

    // Parse win requirements
    let winRequirements = [];
    try {
      winRequirements = JSON.parse(fields['Win Requirements'] || '[]');
    } catch {
      winRequirements = [];
    }

    return {
      id: record.id,
      name: fields['Name'] || '',
      description: fields['Description'] || '',
      triggerMode: fields['Trigger Mode'] || 'sequential',
      isActive: fields['Is Active'] ?? true,
      triggers: [], // Not needed for recalculation
      discordWebhooks,
      oddsRequirement: fields['Odds Type'] ? {
        type: fields['Odds Type'],
        value: fields['Odds Value'] || 0,
        betSide: fields['Bet Side'] || 'leading_team',
      } as OddsRequirement : undefined,
      rules,
      winRequirements,
      expiryTimeQ4: fields['Expiry Time Q4'],
      isTwoStage: fields['Is Two Stage'],
      createdAt: record.createdTime || '',
      updatedAt: record.createdTime || '',
    };
  } catch (error) {
    console.error('Error fetching strategy:', error);
    return null;
  }
}

/**
 * Get historical game by event ID
 */
async function getHistoricalGame(eventId: string): Promise<AirtableHistoricalGameFields | null> {
  try {
    const params = new URLSearchParams();
    params.append('filterByFormula', `{Name} = '${eventId}'`);
    params.append('maxRecords', '1');

    const response = await airtableRequest('Historical Games', `?${params.toString()}`);
    if (!response.ok) return null;

    const data = await response.json();
    const records = data.records || [];

    if (records.length === 0) return null;

    return records[0].fields as AirtableHistoricalGameFields;
  } catch (error) {
    console.error('Error fetching historical game:', error);
    return null;
  }
}

/**
 * Calculate bet result based on odds requirement
 */
function calculateBetResult(
  signal: Partial<Signal>,
  historicalGame: AirtableHistoricalGameFields,
  strategy: Strategy
): 'win' | 'loss' | 'push' {
  const finalHome = historicalGame['Home Score'] || 0;
  const finalAway = historicalGame['Away Score'] || 0;
  const finalDiff = finalHome - finalAway;

  const oddsReq = strategy.oddsRequirement;
  if (!oddsReq) {
    return 'push';
  }

  const { type, betSide, value } = oddsReq;
  const leadingAtTrigger = signal.leadingTeamAtTrigger ||
    ((signal.homeScore || 0) > (signal.awayScore || 0) ? 'home' : 'away');

  // Determine which team was bet on
  let bettingOnHome: boolean;
  if (betSide === 'leading_team') {
    bettingOnHome = leadingAtTrigger === 'home';
  } else if (betSide === 'trailing_team') {
    bettingOnHome = leadingAtTrigger !== 'home';
  } else if (betSide === 'home') {
    bettingOnHome = true;
  } else {
    bettingOnHome = false;
  }

  switch (type) {
    case 'spread': {
      const spreadUsed = signal.actualSpreadAtEntry || value;
      if (bettingOnHome) {
        const homeCover = finalDiff > -spreadUsed;
        const push = finalDiff === -spreadUsed;
        return push ? 'push' : homeCover ? 'win' : 'loss';
      } else {
        const awayCover = -finalDiff > spreadUsed;
        const push = -finalDiff === spreadUsed;
        return push ? 'push' : awayCover ? 'win' : 'loss';
      }
    }

    case 'moneyline': {
      if (finalHome === finalAway) return 'push';
      const homeWon = finalHome > finalAway;
      return (bettingOnHome === homeWon) ? 'win' : 'loss';
    }

    case 'total_over': {
      const totalPoints = finalHome + finalAway;
      const totalLine = signal.entryTotal || value;
      if (totalPoints === totalLine) return 'push';
      return totalPoints > totalLine ? 'win' : 'loss';
    }

    case 'total_under': {
      const totalPoints = finalHome + finalAway;
      const totalLine = signal.entryTotal || value;
      if (totalPoints === totalLine) return 'push';
      return totalPoints < totalLine ? 'win' : 'loss';
    }

    default:
      return 'push';
  }
}

/**
 * Evaluate win requirements for a signal
 */
function evaluateWinRequirements(
  signal: Partial<Signal>,
  historicalGame: AirtableHistoricalGameFields,
  requirements: WinRequirement[]
): boolean {
  if (!requirements || requirements.length === 0) {
    return true; // No requirements = always pass
  }

  const finalHome = historicalGame['Home Score'] || 0;
  const finalAway = historicalGame['Away Score'] || 0;
  const finalDiff = finalHome - finalAway;

  for (const req of requirements) {
    switch (req.type) {
      case 'leading_team_wins': {
        const leadingAtTrigger = signal.leadingTeamAtTrigger ||
          ((signal.homeScore || 0) > (signal.awayScore || 0) ? 'home' : 'away');
        const winner = finalHome > finalAway ? 'home' : finalAway > finalHome ? 'away' : 'tie';
        if (winner !== leadingAtTrigger) return false;
        break;
      }

      case 'home_wins': {
        if (finalHome <= finalAway) return false;
        break;
      }

      case 'away_wins': {
        if (finalAway <= finalHome) return false;
        break;
      }

      case 'final_lead_gte': {
        const absLead = Math.abs(finalDiff);
        if (absLead < (req.value || 0)) return false;
        break;
      }

      case 'final_lead_lte': {
        const absLead = Math.abs(finalDiff);
        if (absLead > (req.value || 0)) return false;
        break;
      }
    }
  }

  return true;
}

/**
 * Recalculate outcome for a single signal
 */
async function recalculateSignalOutcome(
  signalRecord: AirtableRecord
): Promise<RecalculateResult> {
  const fields = signalRecord.fields as AirtableSignalFields;
  const signalId = signalRecord.id;
  const signalName = (fields.Name as string) || signalId;
  const previousResult = fields.Result as 'win' | 'loss' | 'push' | undefined;

  // Skip if signal is not in bet_taken, won, lost, or pushed status
  const status = fields.Status;
  if (!['bet_taken', 'won', 'lost', 'pushed'].includes(status || '')) {
    return {
      signalId,
      signalName,
      previousResult,
      newResult: 'no_change',
      reason: `Signal status is ${status}, not eligible for recalculation`,
    };
  }

  // Get strategy
  const strategyId = Array.isArray(fields.Strategy) ? fields.Strategy[0] : fields.Strategy;
  if (!strategyId) {
    return {
      signalId,
      signalName,
      previousResult,
      newResult: 'error',
      reason: 'No strategy linked to signal',
    };
  }

  const strategy = await getStrategy(strategyId as string);
  if (!strategy) {
    return {
      signalId,
      signalName,
      previousResult,
      newResult: 'error',
      reason: `Strategy ${strategyId} not found`,
    };
  }

  // Get historical game
  const eventId = fields['Event ID'];
  if (!eventId) {
    return {
      signalId,
      signalName,
      previousResult,
      newResult: 'error',
      reason: 'No event ID on signal',
    };
  }

  const historicalGame = await getHistoricalGame(eventId as string);
  if (!historicalGame) {
    return {
      signalId,
      signalName,
      previousResult,
      newResult: 'error',
      reason: `Historical game ${eventId} not found`,
    };
  }

  // Build partial signal for calculation
  const signal: Partial<Signal> = {
    homeScore: fields['Home Score'] as number,
    awayScore: fields['Away Score'] as number,
    leadingTeamAtTrigger: fields['Leading Team At Trigger'] as 'home' | 'away' | undefined,
    actualSpreadAtEntry: fields['Actual Spread At Entry'] as number | undefined,
    entryTotal: fields['Entry Total'] as number | undefined,
  };

  // Calculate new result
  let newResult: 'win' | 'loss' | 'push';

  // Check win requirements first if they exist
  const winRequirements = strategy.winRequirements || [];
  if (winRequirements.length > 0) {
    const passesRequirements = evaluateWinRequirements(signal, historicalGame, winRequirements);
    if (!passesRequirements) {
      newResult = 'loss';
    } else {
      newResult = calculateBetResult(signal, historicalGame, strategy);
    }
  } else {
    newResult = calculateBetResult(signal, historicalGame, strategy);
  }

  // Check if result changed
  if (previousResult === newResult) {
    return {
      signalId,
      signalName,
      previousResult,
      newResult: 'no_change',
      reason: 'Result unchanged',
    };
  }

  // Update signal in Airtable
  const finalStatus = newResult === 'win' ? 'won' : newResult === 'loss' ? 'lost' : 'pushed';

  try {
    const updateResponse = await airtableRequest('Signals', `/${signalId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        fields: {
          Status: finalStatus,
          Result: newResult,
          Notes: `Recalculated from ${previousResult || 'none'} to ${newResult}. Previous status: ${status}`,
        },
      }),
    });

    if (!updateResponse.ok) {
      return {
        signalId,
        signalName,
        previousResult,
        newResult: 'error',
        reason: `Failed to update signal: ${updateResponse.status}`,
      };
    }

    return {
      signalId,
      signalName,
      previousResult,
      newResult,
      reason: `Changed from ${previousResult || 'none'} to ${newResult}`,
    };
  } catch (error) {
    return {
      signalId,
      signalName,
      previousResult,
      newResult: 'error',
      reason: `Error updating signal: ${error}`,
    };
  }
}

/**
 * Recalculate outcomes for specific signals by ID
 */
export async function recalculateByIds(
  signalIds: string[]
): Promise<RecalculateSummary> {
  const results: RecalculateResult[] = [];
  let changed = 0;
  let unchanged = 0;
  let errors = 0;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      totalProcessed: 0,
      changed: 0,
      unchanged: 0,
      errors: 1,
      results: [{ signalId: '', signalName: '', newResult: 'error', reason: 'Missing Airtable credentials' }],
    };
  }

  for (const signalId of signalIds) {
    try {
      const response = await airtableRequest('Signals', `/${signalId}`);
      if (!response.ok) {
        results.push({
          signalId,
          signalName: signalId,
          newResult: 'error',
          reason: `Signal not found: ${response.status}`,
        });
        errors++;
        continue;
      }

      const record = await response.json();
      const result = await recalculateSignalOutcome(record);
      results.push(result);

      if (result.newResult === 'error') {
        errors++;
      } else if (result.newResult === 'no_change') {
        unchanged++;
      } else {
        changed++;
      }
    } catch (error) {
      results.push({
        signalId,
        signalName: signalId,
        newResult: 'error',
        reason: `Error processing: ${error}`,
      });
      errors++;
    }
  }

  console.log(`📊 Recalculated ${signalIds.length} signals: ${changed} changed, ${unchanged} unchanged, ${errors} errors`);

  return {
    success: errors === 0,
    timestamp: new Date().toISOString(),
    totalProcessed: signalIds.length,
    changed,
    unchanged,
    errors,
    results,
  };
}

/**
 * Recalculate outcomes for signals within a date range
 */
export async function recalculateByDateRange(
  startDate: string,
  endDate: string
): Promise<RecalculateSummary> {
  const results: RecalculateResult[] = [];
  let changed = 0;
  let unchanged = 0;
  let errors = 0;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      totalProcessed: 0,
      changed: 0,
      unchanged: 0,
      errors: 1,
      results: [{ signalId: '', signalName: '', newResult: 'error', reason: 'Missing Airtable credentials' }],
    };
  }

  try {
    // Fetch signals within date range
    const params = new URLSearchParams();
    params.append(
      'filterByFormula',
      `AND(
        IS_AFTER({Entry Time}, '${startDate}'),
        IS_BEFORE({Entry Time}, '${endDate}'),
        OR({Status} = 'bet_taken', {Status} = 'won', {Status} = 'lost', {Status} = 'pushed')
      )`
    );

    const response = await airtableRequest('Signals', `?${params.toString()}`);
    if (!response.ok) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        totalProcessed: 0,
        changed: 0,
        unchanged: 0,
        errors: 1,
        results: [{ signalId: '', signalName: '', newResult: 'error', reason: `Failed to fetch signals: ${response.status}` }],
      };
    }

    const data = await response.json();
    const records: AirtableRecord[] = data.records || [];

    for (const record of records) {
      const result = await recalculateSignalOutcome(record);
      results.push(result);

      if (result.newResult === 'error') {
        errors++;
      } else if (result.newResult === 'no_change') {
        unchanged++;
      } else {
        changed++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`📊 Recalculated ${records.length} signals in range ${startDate} to ${endDate}`);

    return {
      success: errors === 0,
      timestamp: new Date().toISOString(),
      totalProcessed: records.length,
      changed,
      unchanged,
      errors,
      results,
    };
  } catch (error) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      totalProcessed: 0,
      changed: 0,
      unchanged: 0,
      errors: 1,
      results: [{ signalId: '', signalName: '', newResult: 'error', reason: `Error: ${error}` }],
    };
  }
}

/**
 * Recalculate outcomes for all signals of a specific strategy
 */
export async function recalculateByStrategy(
  strategyId: string
): Promise<RecalculateSummary> {
  const results: RecalculateResult[] = [];
  let changed = 0;
  let unchanged = 0;
  let errors = 0;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      totalProcessed: 0,
      changed: 0,
      unchanged: 0,
      errors: 1,
      results: [{ signalId: '', signalName: '', newResult: 'error', reason: 'Missing Airtable credentials' }],
    };
  }

  try {
    // Fetch signals for strategy
    const params = new URLSearchParams();
    params.append(
      'filterByFormula',
      `AND(
        FIND('${strategyId}', ARRAYJOIN({Strategy})) > 0,
        OR({Status} = 'bet_taken', {Status} = 'won', {Status} = 'lost', {Status} = 'pushed')
      )`
    );

    const response = await airtableRequest('Signals', `?${params.toString()}`);
    if (!response.ok) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        totalProcessed: 0,
        changed: 0,
        unchanged: 0,
        errors: 1,
        results: [{ signalId: '', signalName: '', newResult: 'error', reason: `Failed to fetch signals: ${response.status}` }],
      };
    }

    const data = await response.json();
    const records: AirtableRecord[] = data.records || [];

    for (const record of records) {
      const result = await recalculateSignalOutcome(record);
      results.push(result);

      if (result.newResult === 'error') {
        errors++;
      } else if (result.newResult === 'no_change') {
        unchanged++;
      } else {
        changed++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`📊 Recalculated ${records.length} signals for strategy ${strategyId}`);

    return {
      success: errors === 0,
      timestamp: new Date().toISOString(),
      totalProcessed: records.length,
      changed,
      unchanged,
      errors,
      results,
    };
  } catch (error) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      totalProcessed: 0,
      changed: 0,
      unchanged: 0,
      errors: 1,
      results: [{ signalId: '', signalName: '', newResult: 'error', reason: `Error: ${error}` }],
    };
  }
}

/**
 * Recalculate all outcomes (use with caution)
 */
export async function recalculateAll(): Promise<RecalculateSummary> {
  const results: RecalculateResult[] = [];
  let changed = 0;
  let unchanged = 0;
  let errors = 0;
  let totalProcessed = 0;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      totalProcessed: 0,
      changed: 0,
      unchanged: 0,
      errors: 1,
      results: [{ signalId: '', signalName: '', newResult: 'error', reason: 'Missing Airtable credentials' }],
    };
  }

  try {
    // Fetch all eligible signals
    const params = new URLSearchParams();
    params.append(
      'filterByFormula',
      `OR({Status} = 'bet_taken', {Status} = 'won', {Status} = 'lost', {Status} = 'pushed')`
    );

    let offset: string | undefined;
    do {
      const url = offset ? `?${params.toString()}&offset=${offset}` : `?${params.toString()}`;
      const response = await airtableRequest('Signals', url);

      if (!response.ok) {
        results.push({
          signalId: '',
          signalName: '',
          newResult: 'error',
          reason: `Failed to fetch signals: ${response.status}`,
        });
        errors++;
        break;
      }

      const data = await response.json();
      const records: AirtableRecord[] = data.records || [];
      offset = data.offset;

      for (const record of records) {
        const result = await recalculateSignalOutcome(record);
        results.push(result);
        totalProcessed++;

        if (result.newResult === 'error') {
          errors++;
        } else if (result.newResult === 'no_change') {
          unchanged++;
        } else {
          changed++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } while (offset);

    console.log(`📊 Recalculated all ${totalProcessed} signals: ${changed} changed, ${unchanged} unchanged, ${errors} errors`);

    return {
      success: errors === 0,
      timestamp: new Date().toISOString(),
      totalProcessed,
      changed,
      unchanged,
      errors,
      results,
    };
  } catch (error) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      totalProcessed,
      changed,
      unchanged,
      errors: errors + 1,
      results: [...results, { signalId: '', signalName: '', newResult: 'error', reason: `Error: ${error}` }],
    };
  }
}
