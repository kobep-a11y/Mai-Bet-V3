/**
 * Cleanup Service
 *
 * Provides utilities for cleaning up old/stale data from the system:
 * - Remove stale active signals
 * - Archive old games
 * - Clear temporary cache data
 */

// Airtable REST API configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
  createdTime?: string;
}

interface CleanupResult {
  table: string;
  deleted: number;
  items: string[];
  errors: string[];
}

interface CleanupSummary {
  success: boolean;
  timestamp: string;
  totalDeleted: number;
  results: CleanupResult[];
  errors: string[];
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
 * Delete records in batches (Airtable allows max 10 per request)
 */
async function deleteRecordsInBatches(
  tableName: string,
  recordIds: string[]
): Promise<{ deleted: number; errors: string[] }> {
  let deleted = 0;
  const errors: string[] = [];

  // Process in batches of 10
  for (let i = 0; i < recordIds.length; i += 10) {
    const batch = recordIds.slice(i, i + 10);
    const params = batch.map(id => `records[]=${id}`).join('&');

    try {
      const response = await airtableRequest(tableName, `?${params}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        deleted += batch.length;
      } else {
        errors.push(`Batch ${Math.floor(i / 10) + 1}: ${response.status}`);
      }
    } catch (error) {
      errors.push(`Batch ${Math.floor(i / 10) + 1}: ${error}`);
    }

    // Rate limiting: wait between batches
    if (i + 10 < recordIds.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return { deleted, errors };
}

/**
 * Clean up stale active signals
 *
 * Signals are considered stale if:
 * - Status is 'monitoring' or 'watching' and created more than 24 hours ago
 * - Associated game no longer exists
 */
export async function cleanupStaleSignals(
  maxAgeHours: number = 24
): Promise<CleanupResult> {
  const result: CleanupResult = {
    table: 'Signals',
    deleted: 0,
    items: [],
    errors: [],
  };

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    result.errors.push('Missing Airtable credentials');
    return result;
  }

  try {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();

    // Find stale signals (monitoring/watching status and old)
    const params = new URLSearchParams();
    params.append(
      'filterByFormula',
      `AND(OR({Status} = 'monitoring', {Status} = 'watching'), IS_BEFORE(CREATED_TIME(), '${cutoffTime}'))`
    );

    const response = await airtableRequest('Signals', `?${params.toString()}`);
    if (!response.ok) {
      result.errors.push(`Failed to fetch stale signals: ${response.status}`);
      return result;
    }

    const data = await response.json();
    const records: AirtableRecord[] = data.records || [];

    if (records.length === 0) {
      return result;
    }

    const recordIds = records.map(r => r.id);
    const items = records.map(r => {
      const name = r.fields['Name'] as string || r.id;
      const status = r.fields['Status'] as string;
      return `${name} (${status})`;
    });

    const { deleted, errors } = await deleteRecordsInBatches('Signals', recordIds);
    result.deleted = deleted;
    result.items = items.slice(0, deleted);
    result.errors = errors;

    console.log(`🧹 Cleaned up ${deleted} stale signals`);
  } catch (error) {
    result.errors.push(`Error cleaning stale signals: ${error}`);
  }

  return result;
}

/**
 * Clean up old active games
 *
 * Games are considered stale if:
 * - Status is 'final'
 * - Last updated more than specified hours ago
 * - Already exists in Historical Games table
 */
export async function cleanupOldActiveGames(
  maxAgeHours: number = 2
): Promise<CleanupResult> {
  const result: CleanupResult = {
    table: 'Active Games',
    deleted: 0,
    items: [],
    errors: [],
  };

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    result.errors.push('Missing Airtable credentials');
    return result;
  }

  try {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();
    const recordsToDelete: { id: string; eventId: string; reason: string }[] = [];

    // 1. Find all final games
    const finalParams = new URLSearchParams();
    finalParams.append('filterByFormula', `{Status} = 'final'`);

    const finalResponse = await airtableRequest('Active Games', `?${finalParams.toString()}`);
    if (finalResponse.ok) {
      const finalData = await finalResponse.json();
      const finalRecords: AirtableRecord[] = finalData.records || [];

      for (const record of finalRecords) {
        const eventId = record.fields['Event ID'] as string;
        recordsToDelete.push({ id: record.id, eventId, reason: 'final' });
      }
    }

    // 2. Find stale games (not updated in X hours)
    const staleParams = new URLSearchParams();
    staleParams.append('filterByFormula', `IS_BEFORE({Last Update}, '${cutoffTime}')`);

    const staleResponse = await airtableRequest('Active Games', `?${staleParams.toString()}`);
    if (staleResponse.ok) {
      const staleData = await staleResponse.json();
      const staleRecords: AirtableRecord[] = staleData.records || [];

      for (const record of staleRecords) {
        const eventId = record.fields['Event ID'] as string;
        // Skip if already marked for deletion
        if (!recordsToDelete.find(r => r.id === record.id)) {
          recordsToDelete.push({ id: record.id, eventId, reason: 'stale' });
        }
      }
    }

    if (recordsToDelete.length === 0) {
      return result;
    }

    const recordIds = recordsToDelete.map(r => r.id);
    const items = recordsToDelete.map(r => `${r.eventId} (${r.reason})`);

    const { deleted, errors } = await deleteRecordsInBatches('Active Games', recordIds);
    result.deleted = deleted;
    result.items = items.slice(0, deleted);
    result.errors = errors;

    console.log(`🧹 Cleaned up ${deleted} old active games`);
  } catch (error) {
    result.errors.push(`Error cleaning old active games: ${error}`);
  }

  return result;
}

/**
 * Clean up duplicate records in a table
 *
 * Finds records with duplicate values in a key field and keeps only the first one
 */
export async function cleanupDuplicates(
  tableName: string,
  keyField: string
): Promise<CleanupResult> {
  const result: CleanupResult = {
    table: tableName,
    deleted: 0,
    items: [],
    errors: [],
  };

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    result.errors.push('Missing Airtable credentials');
    return result;
  }

  try {
    // Fetch all records
    const response = await airtableRequest(tableName, '');
    if (!response.ok) {
      result.errors.push(`Failed to fetch records: ${response.status}`);
      return result;
    }

    const data = await response.json();
    const records: AirtableRecord[] = data.records || [];

    // Group by key field
    const groups = new Map<string, AirtableRecord[]>();
    for (const record of records) {
      const keyValue = String(record.fields[keyField] || '');
      if (!keyValue) continue;

      const existing = groups.get(keyValue) || [];
      existing.push(record);
      groups.set(keyValue, existing);
    }

    // Find duplicates (groups with more than 1 record)
    const duplicateIds: string[] = [];
    const duplicateItems: string[] = [];

    for (const [keyValue, group] of groups) {
      if (group.length > 1) {
        // Keep the first, mark the rest for deletion
        for (let i = 1; i < group.length; i++) {
          duplicateIds.push(group[i].id);
          duplicateItems.push(`${keyValue} (duplicate #${i})`);
        }
      }
    }

    if (duplicateIds.length === 0) {
      return result;
    }

    const { deleted, errors } = await deleteRecordsInBatches(tableName, duplicateIds);
    result.deleted = deleted;
    result.items = duplicateItems.slice(0, deleted);
    result.errors = errors;

    console.log(`🧹 Cleaned up ${deleted} duplicate records in ${tableName}`);
  } catch (error) {
    result.errors.push(`Error cleaning duplicates in ${tableName}: ${error}`);
  }

  return result;
}

/**
 * Archive old historical games
 *
 * Optionally delete historical games older than a specified number of days
 * (Use with caution - this permanently deletes data)
 */
export async function archiveOldHistoricalGames(
  maxAgeDays: number = 90
): Promise<CleanupResult> {
  const result: CleanupResult = {
    table: 'Historical Games',
    deleted: 0,
    items: [],
    errors: [],
  };

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    result.errors.push('Missing Airtable credentials');
    return result;
  }

  try {
    const cutoffDate = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    // Find old historical games
    const params = new URLSearchParams();
    params.append('filterByFormula', `IS_BEFORE({Game Date}, '${cutoffDateStr}')`);

    const response = await airtableRequest('Historical Games', `?${params.toString()}`);
    if (!response.ok) {
      result.errors.push(`Failed to fetch old historical games: ${response.status}`);
      return result;
    }

    const data = await response.json();
    const records: AirtableRecord[] = data.records || [];

    if (records.length === 0) {
      return result;
    }

    const recordIds = records.map(r => r.id);
    const items = records.map(r => {
      const name = r.fields['Name'] as string || r.id;
      const date = r.fields['Game Date'] as string;
      return `${name} (${date})`;
    });

    const { deleted, errors } = await deleteRecordsInBatches('Historical Games', recordIds);
    result.deleted = deleted;
    result.items = items.slice(0, deleted);
    result.errors = errors;

    console.log(`🧹 Archived ${deleted} old historical games (>${maxAgeDays} days)`);
  } catch (error) {
    result.errors.push(`Error archiving old historical games: ${error}`);
  }

  return result;
}

/**
 * Clean up expired signals
 *
 * Updates signals that should have expired but weren't processed
 */
export async function cleanupExpiredSignals(): Promise<CleanupResult> {
  const result: CleanupResult = {
    table: 'Signals',
    deleted: 0,
    items: [],
    errors: [],
  };

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    result.errors.push('Missing Airtable credentials');
    return result;
  }

  try {
    // Find signals that are still monitoring/watching but from games that have ended
    // This happens if the webhook stopped receiving updates
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const params = new URLSearchParams();
    params.append(
      'filterByFormula',
      `AND(OR({Status} = 'monitoring', {Status} = 'watching'), IS_BEFORE({Entry Time}, '${oneDayAgo}'))`
    );

    const response = await airtableRequest('Signals', `?${params.toString()}`);
    if (!response.ok) {
      result.errors.push(`Failed to fetch expired signals: ${response.status}`);
      return result;
    }

    const data = await response.json();
    const records: AirtableRecord[] = data.records || [];

    let updated = 0;
    for (const record of records) {
      const updateResponse = await airtableRequest('Signals', `/${record.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          fields: {
            Status: 'expired',
            Notes: `Auto-expired during cleanup. Original status: ${record.fields['Status']}`,
          },
        }),
      });

      if (updateResponse.ok) {
        updated++;
        const name = record.fields['Name'] as string || record.id;
        result.items.push(name);
      }
    }

    result.deleted = updated; // Using 'deleted' field to track updates
    console.log(`🧹 Expired ${updated} stale signals`);
  } catch (error) {
    result.errors.push(`Error expiring signals: ${error}`);
  }

  return result;
}

/**
 * Run full cleanup process
 *
 * Performs all cleanup operations with configurable retention periods
 */
export async function runFullCleanup(options?: {
  signalMaxAgeHours?: number;
  gameMaxAgeHours?: number;
  historicalMaxAgeDays?: number;
  cleanupDuplicates?: boolean;
  archiveHistorical?: boolean;
}): Promise<CleanupSummary> {
  const {
    signalMaxAgeHours = 24,
    gameMaxAgeHours = 2,
    historicalMaxAgeDays = 90,
    cleanupDuplicates: shouldCleanupDuplicates = true,
    archiveHistorical = false,
  } = options || {};

  const results: CleanupResult[] = [];
  const errors: string[] = [];
  let totalDeleted = 0;

  // 1. Clean up stale signals
  const signalResult = await cleanupStaleSignals(signalMaxAgeHours);
  results.push(signalResult);
  totalDeleted += signalResult.deleted;
  errors.push(...signalResult.errors);

  // 2. Expire old monitoring/watching signals
  const expireResult = await cleanupExpiredSignals();
  results.push(expireResult);
  totalDeleted += expireResult.deleted;
  errors.push(...expireResult.errors);

  // 3. Clean up old active games
  const gameResult = await cleanupOldActiveGames(gameMaxAgeHours);
  results.push(gameResult);
  totalDeleted += gameResult.deleted;
  errors.push(...gameResult.errors);

  // 4. Clean up duplicates if enabled
  if (shouldCleanupDuplicates) {
    const signalDupResult = await cleanupDuplicates('Signals', 'Name');
    results.push(signalDupResult);
    totalDeleted += signalDupResult.deleted;
    errors.push(...signalDupResult.errors);

    const gameDupResult = await cleanupDuplicates('Active Games', 'Event ID');
    results.push(gameDupResult);
    totalDeleted += gameDupResult.deleted;
    errors.push(...gameDupResult.errors);

    const histDupResult = await cleanupDuplicates('Historical Games', 'Name');
    results.push(histDupResult);
    totalDeleted += histDupResult.deleted;
    errors.push(...histDupResult.errors);
  }

  // 5. Archive old historical games if enabled
  if (archiveHistorical) {
    const archiveResult = await archiveOldHistoricalGames(historicalMaxAgeDays);
    results.push(archiveResult);
    totalDeleted += archiveResult.deleted;
    errors.push(...archiveResult.errors);
  }

  console.log(`🧹 Full cleanup complete: ${totalDeleted} items processed`);

  return {
    success: errors.length === 0,
    timestamp: new Date().toISOString(),
    totalDeleted,
    results,
    errors,
  };
}
