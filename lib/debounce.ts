/**
 * Webhook Debouncing Module
 *
 * Prevents duplicate processing of webhooks for the same event ID
 * by tracking recently processed events and rejecting duplicates
 * within a time window.
 */

interface ProcessingRecord {
  timestamp: number;
  count: number;
}

// Track recently processed event IDs
const recentlyProcessed = new Map<string, ProcessingRecord>();

// Cleanup interval (run every 60 seconds)
const CLEANUP_INTERVAL = 60 * 1000;

// How long to remember an event ID (5 seconds)
const DEBOUNCE_WINDOW = 5 * 1000;

// Max updates per event per window
const MAX_UPDATES_PER_WINDOW = 2;

// Track if cleanup is scheduled
let cleanupScheduled = false;

/**
 * Schedule periodic cleanup of old entries
 */
function scheduleCleanup() {
  if (cleanupScheduled) return;
  cleanupScheduled = true;

  setInterval(() => {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, record] of recentlyProcessed.entries()) {
      if (now - record.timestamp > DEBOUNCE_WINDOW * 2) {
        recentlyProcessed.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Debounce cleanup: removed ${cleaned} stale entries`);
    }
  }, CLEANUP_INTERVAL);
}

/**
 * Check if an event should be processed or debounced
 *
 * @param eventId - The event ID to check
 * @returns Object with shouldProcess boolean and reason string
 */
export function shouldProcessEvent(eventId: string): { shouldProcess: boolean; reason: string } {
  scheduleCleanup();

  const now = Date.now();
  const existing = recentlyProcessed.get(eventId);

  if (!existing) {
    // First time seeing this event
    recentlyProcessed.set(eventId, { timestamp: now, count: 1 });
    return { shouldProcess: true, reason: 'new_event' };
  }

  const timeSinceLastUpdate = now - existing.timestamp;

  if (timeSinceLastUpdate > DEBOUNCE_WINDOW) {
    // Window expired, reset count
    recentlyProcessed.set(eventId, { timestamp: now, count: 1 });
    return { shouldProcess: true, reason: 'window_expired' };
  }

  if (existing.count >= MAX_UPDATES_PER_WINDOW) {
    // Too many updates in window
    return {
      shouldProcess: false,
      reason: `debounced: ${existing.count} updates in ${timeSinceLastUpdate}ms`
    };
  }

  // Allow update, increment count
  existing.count++;
  existing.timestamp = now;
  return { shouldProcess: true, reason: 'within_limit' };
}

/**
 * Mark an event as being actively processed
 * Used to implement distributed locking
 */
const activeProcessing = new Set<string>();

export function startProcessing(eventId: string): boolean {
  if (activeProcessing.has(eventId)) {
    return false; // Already being processed
  }
  activeProcessing.add(eventId);
  return true;
}

export function finishProcessing(eventId: string): void {
  activeProcessing.delete(eventId);
}

/**
 * Get debounce stats for debugging
 */
export function getDebounceStats(): {
  trackedEvents: number;
  activelyProcessing: number;
  oldestEntry: number | null;
} {
  let oldest: number | null = null;
  const now = Date.now();

  for (const record of recentlyProcessed.values()) {
    const age = now - record.timestamp;
    if (oldest === null || age > oldest) {
      oldest = age;
    }
  }

  return {
    trackedEvents: recentlyProcessed.size,
    activelyProcessing: activeProcessing.size,
    oldestEntry: oldest,
  };
}

/**
 * Clear all debounce state (for testing)
 */
export function clearDebounceState(): void {
  recentlyProcessed.clear();
  activeProcessing.clear();
}
