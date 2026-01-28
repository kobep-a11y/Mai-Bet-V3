import { NextResponse } from 'next/server';
import {
  getCurrentBalance,
  getBankrollSummary,
  getTransactions,
  recordDeposit,
  recordWithdrawal,
  recordBet,
  recordBetResult,
} from '@/lib/bankroll-service';

/**
 * GET /api/bankroll
 * Get bankroll summary and recent transactions
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'summary';
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    switch (action) {
      case 'balance':
        const balance = await getCurrentBalance();
        return NextResponse.json({ balance });

      case 'transactions':
        const transactions = await getTransactions({ limit });
        return NextResponse.json({ transactions });

      case 'summary':
      default:
        const summary = await getBankrollSummary();
        const recentTransactions = await getTransactions({ limit: 10 });
        return NextResponse.json({
          summary,
          recentTransactions,
        });
    }
  } catch (error) {
    console.error('Bankroll API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bankroll data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bankroll
 * Record bankroll transactions
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    let result;

    switch (action) {
      case 'deposit':
        if (!params.amount || params.amount <= 0) {
          return NextResponse.json(
            { error: 'Valid amount is required for deposit' },
            { status: 400 }
          );
        }
        result = await recordDeposit(params.amount, params.notes);
        break;

      case 'withdrawal':
        if (!params.amount || params.amount <= 0) {
          return NextResponse.json(
            { error: 'Valid amount is required for withdrawal' },
            { status: 400 }
          );
        }
        const currentBalance = await getCurrentBalance();
        if (params.amount > currentBalance) {
          return NextResponse.json(
            { error: 'Insufficient balance for withdrawal' },
            { status: 400 }
          );
        }
        result = await recordWithdrawal(params.amount, params.notes);
        break;

      case 'bet':
        if (!params.signalId || !params.strategyName || !params.amount) {
          return NextResponse.json(
            { error: 'signalId, strategyName, and amount are required for bet' },
            { status: 400 }
          );
        }
        result = await recordBet({
          signalId: params.signalId,
          strategyName: params.strategyName,
          amount: params.amount,
          odds: params.odds,
          unitSize: params.unitSize,
          unitsWagered: params.unitsWagered,
        });
        break;

      case 'result':
        if (!params.signalId || !params.strategyName || !params.result || !params.betAmount) {
          return NextResponse.json(
            { error: 'signalId, strategyName, result, and betAmount are required' },
            { status: 400 }
          );
        }
        if (!['win', 'loss', 'push'].includes(params.result)) {
          return NextResponse.json(
            { error: 'result must be win, loss, or push' },
            { status: 400 }
          );
        }
        result = await recordBetResult({
          signalId: params.signalId,
          strategyName: params.strategyName,
          result: params.result,
          betAmount: params.betAmount,
          odds: params.odds,
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: deposit, withdrawal, bet, or result' },
          { status: 400 }
        );
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to record transaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction: result,
    });
  } catch (error) {
    console.error('Bankroll API error:', error);
    return NextResponse.json(
      { error: 'Failed to process bankroll transaction' },
      { status: 500 }
    );
  }
}
