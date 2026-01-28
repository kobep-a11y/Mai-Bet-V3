/**
 * Bankroll Management Service
 * Tracks betting transactions, P/L, and running balance
 */

// Airtable REST API configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = 'Bankroll';

export interface BankrollTransaction {
  id?: string;
  transactionId: string;
  date: string;
  type: 'bet' | 'win' | 'loss' | 'push' | 'deposit' | 'withdrawal';
  amount: number;
  signalId?: string;
  strategyName?: string;
  unitSize?: number;
  unitsWagered?: number;
  odds?: number;
  runningBalance: number;
  notes?: string;
}

export interface BankrollSummary {
  currentBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalWagered: number;
  totalWon: number;
  totalLost: number;
  netProfit: number;
  roi: number;
  winRate: number;
  totalBets: number;
  wonBets: number;
  lostBets: number;
  pushedBets: number;
}

export interface BankrollSettings {
  defaultUnitSize: number;
  bankrollGoal?: number;
  maxBetUnits: number;
  stopLossUnits?: number;
}

// Default settings
const DEFAULT_SETTINGS: BankrollSettings = {
  defaultUnitSize: 10,
  maxBetUnits: 5,
};

/**
 * Helper function to make Airtable REST API requests
 */
async function airtableRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}${endpoint}`;

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
 * Get current bankroll balance (most recent running balance)
 */
export async function getCurrentBalance(): Promise<number> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Missing Airtable credentials');
    return 0;
  }

  try {
    const params = new URLSearchParams();
    params.append('sort[0][field]', 'Date');
    params.append('sort[0][direction]', 'desc');
    params.append('maxRecords', '1');

    const response = await airtableRequest(`?${params.toString()}`);
    const result = await response.json();

    if (response.ok && result.records?.length > 0) {
      return result.records[0].fields['Running Balance'] || 0;
    }

    return 0;
  } catch (error) {
    console.error('Error getting current balance:', error);
    return 0;
  }
}

/**
 * Record a new bankroll transaction
 */
export async function recordTransaction(
  transaction: Omit<BankrollTransaction, 'id' | 'runningBalance'>
): Promise<BankrollTransaction | null> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Missing Airtable credentials');
    return null;
  }

  try {
    // Get current balance
    const currentBalance = await getCurrentBalance();

    // Calculate new balance based on transaction type
    let balanceChange = 0;
    switch (transaction.type) {
      case 'deposit':
        balanceChange = transaction.amount;
        break;
      case 'withdrawal':
        balanceChange = -transaction.amount;
        break;
      case 'bet':
        balanceChange = -transaction.amount;
        break;
      case 'win':
        balanceChange = transaction.amount;
        break;
      case 'loss':
        balanceChange = 0; // Loss already deducted when bet was placed
        break;
      case 'push':
        balanceChange = transaction.amount; // Return stake
        break;
    }

    const newBalance = currentBalance + balanceChange;

    // Create record
    const fields: Record<string, unknown> = {
      'Transaction ID': transaction.transactionId,
      'Date': transaction.date,
      'Type': transaction.type,
      'Amount': transaction.amount,
      'Running Balance': newBalance,
    };

    if (transaction.signalId) fields['Signal ID'] = transaction.signalId;
    if (transaction.strategyName) fields['Strategy Name'] = transaction.strategyName;
    if (transaction.unitSize) fields['Unit Size'] = transaction.unitSize;
    if (transaction.unitsWagered) fields['Units Wagered'] = transaction.unitsWagered;
    if (transaction.odds) fields['Odds'] = transaction.odds;
    if (transaction.notes) fields['Notes'] = transaction.notes;

    const response = await airtableRequest('', {
      method: 'POST',
      body: JSON.stringify({ fields }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Error recording transaction:', result);
      return null;
    }

    console.log(`✅ Bankroll transaction recorded: ${transaction.type} $${transaction.amount}`);

    return {
      id: result.id,
      ...transaction,
      runningBalance: newBalance,
    };
  } catch (error) {
    console.error('Error recording transaction:', error);
    return null;
  }
}

/**
 * Record a bet placement
 */
export async function recordBet(params: {
  signalId: string;
  strategyName: string;
  amount: number;
  odds?: number;
  unitSize?: number;
  unitsWagered?: number;
}): Promise<BankrollTransaction | null> {
  return recordTransaction({
    transactionId: `BET-${params.signalId}-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    type: 'bet',
    amount: params.amount,
    signalId: params.signalId,
    strategyName: params.strategyName,
    odds: params.odds || -110,
    unitSize: params.unitSize,
    unitsWagered: params.unitsWagered,
  });
}

/**
 * Record a bet result (win/loss/push)
 */
export async function recordBetResult(params: {
  signalId: string;
  strategyName: string;
  result: 'win' | 'loss' | 'push';
  betAmount: number;
  odds?: number;
}): Promise<BankrollTransaction | null> {
  const odds = params.odds || -110;

  let amount = 0;
  if (params.result === 'win') {
    // Calculate winnings based on American odds
    if (odds > 0) {
      amount = params.betAmount * (odds / 100);
    } else {
      amount = params.betAmount * (100 / Math.abs(odds));
    }
    amount += params.betAmount; // Include return of stake
  } else if (params.result === 'push') {
    amount = params.betAmount; // Return stake only
  }

  return recordTransaction({
    transactionId: `${params.result.toUpperCase()}-${params.signalId}-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    type: params.result,
    amount: Math.round(amount * 100) / 100,
    signalId: params.signalId,
    strategyName: params.strategyName,
    odds,
  });
}

/**
 * Record a deposit
 */
export async function recordDeposit(amount: number, notes?: string): Promise<BankrollTransaction | null> {
  return recordTransaction({
    transactionId: `DEP-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    type: 'deposit',
    amount,
    notes,
  });
}

/**
 * Record a withdrawal
 */
export async function recordWithdrawal(amount: number, notes?: string): Promise<BankrollTransaction | null> {
  return recordTransaction({
    transactionId: `WD-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    type: 'withdrawal',
    amount,
    notes,
  });
}

/**
 * Get all transactions
 */
export async function getTransactions(options?: {
  limit?: number;
  startDate?: string;
  endDate?: string;
}): Promise<BankrollTransaction[]> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Missing Airtable credentials');
    return [];
  }

  try {
    const params = new URLSearchParams();
    params.append('sort[0][field]', 'Date');
    params.append('sort[0][direction]', 'desc');
    params.append('pageSize', String(options?.limit || 100));

    // Add date filter if provided
    if (options?.startDate || options?.endDate) {
      const filters: string[] = [];
      if (options.startDate) {
        filters.push(`IS_AFTER({Date}, '${options.startDate}')`);
      }
      if (options.endDate) {
        filters.push(`IS_BEFORE({Date}, '${options.endDate}')`);
      }
      params.append('filterByFormula', `AND(${filters.join(', ')})`);
    }

    const response = await airtableRequest(`?${params.toString()}`);
    const result = await response.json();

    if (!response.ok) {
      console.error('Error fetching transactions:', result);
      return [];
    }

    return result.records.map((record: { id: string; fields: Record<string, unknown> }) => ({
      id: record.id,
      transactionId: record.fields['Transaction ID'] as string,
      date: record.fields['Date'] as string,
      type: record.fields['Type'] as BankrollTransaction['type'],
      amount: record.fields['Amount'] as number,
      signalId: record.fields['Signal ID'] as string | undefined,
      strategyName: record.fields['Strategy Name'] as string | undefined,
      unitSize: record.fields['Unit Size'] as number | undefined,
      unitsWagered: record.fields['Units Wagered'] as number | undefined,
      odds: record.fields['Odds'] as number | undefined,
      runningBalance: record.fields['Running Balance'] as number,
      notes: record.fields['Notes'] as string | undefined,
    }));
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

/**
 * Calculate bankroll summary statistics
 */
export async function getBankrollSummary(): Promise<BankrollSummary> {
  const transactions = await getTransactions({ limit: 1000 });

  const summary: BankrollSummary = {
    currentBalance: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalWagered: 0,
    totalWon: 0,
    totalLost: 0,
    netProfit: 0,
    roi: 0,
    winRate: 0,
    totalBets: 0,
    wonBets: 0,
    lostBets: 0,
    pushedBets: 0,
  };

  if (transactions.length === 0) return summary;

  // Get current balance from most recent transaction
  summary.currentBalance = transactions[0]?.runningBalance || 0;

  for (const tx of transactions) {
    switch (tx.type) {
      case 'deposit':
        summary.totalDeposits += tx.amount;
        break;
      case 'withdrawal':
        summary.totalWithdrawals += tx.amount;
        break;
      case 'bet':
        summary.totalWagered += tx.amount;
        summary.totalBets++;
        break;
      case 'win':
        summary.totalWon += tx.amount;
        summary.wonBets++;
        break;
      case 'loss':
        summary.totalLost += tx.amount;
        summary.lostBets++;
        break;
      case 'push':
        summary.pushedBets++;
        break;
    }
  }

  // Calculate derived stats
  summary.netProfit = summary.currentBalance - summary.totalDeposits + summary.totalWithdrawals;
  summary.roi = summary.totalWagered > 0 ? (summary.netProfit / summary.totalWagered) * 100 : 0;
  const decidedBets = summary.wonBets + summary.lostBets;
  summary.winRate = decidedBets > 0 ? (summary.wonBets / decidedBets) * 100 : 0;

  return summary;
}

/**
 * Get bankroll settings (stored in memory for now, could be persisted)
 */
export function getBankrollSettings(): BankrollSettings {
  // TODO: Load from Airtable or config
  return DEFAULT_SETTINGS;
}

/**
 * Calculate recommended bet size based on Kelly Criterion
 */
export function calculateKellyBet(params: {
  winProbability: number;
  odds: number;
  bankroll: number;
  maxUnits?: number;
  unitSize?: number;
}): { units: number; amount: number } {
  const { winProbability, odds, bankroll, maxUnits = 5, unitSize = 10 } = params;

  // Convert American odds to decimal
  let decimalOdds: number;
  if (odds > 0) {
    decimalOdds = 1 + odds / 100;
  } else {
    decimalOdds = 1 + 100 / Math.abs(odds);
  }

  // Kelly formula: f* = (bp - q) / b
  // where b = decimal odds - 1, p = win probability, q = 1 - p
  const b = decimalOdds - 1;
  const p = winProbability;
  const q = 1 - p;

  let kellyFraction = (b * p - q) / b;

  // Cap at fractional Kelly (25%) for safety
  kellyFraction = Math.min(kellyFraction * 0.25, 0.1);

  // Don't bet if Kelly is negative
  if (kellyFraction <= 0) {
    return { units: 0, amount: 0 };
  }

  const recommendedAmount = bankroll * kellyFraction;
  const units = Math.min(Math.ceil(recommendedAmount / unitSize), maxUnits);

  return {
    units,
    amount: units * unitSize,
  };
}
