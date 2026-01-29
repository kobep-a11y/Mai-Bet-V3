/**
 * AI Strategy Builder API Endpoint
 * POST /api/ai/build-strategy
 *
 * Accepts a natural language description and returns a structured strategy configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  buildStrategyFromDescription,
  validateConditions,
  suggestConditionsFromKeywords,
  StrategyBuilderRequest,
} from '@/lib/ai/strategy-builder';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, sport } = body as StrategyBuilderRequest;

    if (!description) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: description',
        },
        { status: 400 }
      );
    }

    if (typeof description !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Description must be a string',
        },
        { status: 400 }
      );
    }

    // Build strategy from description
    const result = await buildStrategyFromDescription({ description, sport });

    // Validate generated conditions
    if (result.suggestedTriggers && result.suggestedTriggers.length > 0) {
      const trigger = result.suggestedTriggers[0];
      if (trigger.conditions && trigger.conditions.length > 0) {
        const validation = validateConditions(trigger.conditions);
        if (!validation.valid) {
          result.warnings = [
            ...(result.warnings || []),
            ...validation.errors.map((e) => `Validation: ${e}`),
          ];
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in AI strategy builder:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/build-strategy?keywords=lead,q3,spread
 *
 * Get condition suggestions based on keywords
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keywordsParam = searchParams.get('keywords');

    if (!keywordsParam) {
      // Return available field keywords
      const availableKeywords = [
        // Score keywords
        { keyword: 'lead', description: 'Current point lead (absolute value)', field: 'currentLead' },
        { keyword: 'margin', description: 'Score margin', field: 'currentLead' },
        { keyword: 'home score', description: 'Home team score', field: 'homeScore' },
        { keyword: 'away score', description: 'Away team score', field: 'awayScore' },
        { keyword: 'total score', description: 'Combined score', field: 'totalScore' },

        // Quarter keywords
        { keyword: 'quarter', description: 'Current quarter (1-4)', field: 'quarter' },
        { keyword: 'q1', description: 'First quarter', field: 'quarter' },
        { keyword: 'q2', description: 'Second quarter', field: 'quarter' },
        { keyword: 'q3', description: 'Third quarter', field: 'quarter' },
        { keyword: 'q4', description: 'Fourth quarter', field: 'quarter' },

        // Time keywords
        { keyword: 'time remaining', description: 'Seconds left in quarter', field: 'timeRemainingSeconds' },
        { keyword: 'time left', description: 'Time remaining', field: 'timeRemainingSeconds' },

        // Halftime keywords
        { keyword: 'halftime lead', description: 'Halftime margin', field: 'halftimeLead' },
        { keyword: 'first half total', description: 'First half combined score', field: 'firstHalfTotal' },

        // Spread keywords
        { keyword: 'spread', description: 'Point spread', field: 'leadingTeamSpread' },
        { keyword: 'home spread', description: 'Home team spread', field: 'homeSpread' },
        { keyword: 'away spread', description: 'Away team spread', field: 'awaySpread' },

        // Player stats keywords
        { keyword: 'win percentage', description: 'Player win rate difference', field: 'winPctDiff' },
        { keyword: 'experience', description: 'Games played difference', field: 'experienceDiff' },
        { keyword: 'ppm', description: 'Points per match difference', field: 'ppmDiff' },
      ];

      return NextResponse.json({
        success: true,
        availableKeywords,
        usage: 'Add ?keywords=lead,q3,spread to get condition suggestions for specific keywords',
      });
    }

    const keywords = keywordsParam.split(',').map((k) => k.trim());
    const suggestedConditions = suggestConditionsFromKeywords(keywords);

    return NextResponse.json({
      success: true,
      keywords,
      suggestedConditions,
      message:
        suggestedConditions.length > 0
          ? `Found ${suggestedConditions.length} condition(s) for the provided keywords`
          : 'No conditions found for the provided keywords. Try different keywords.',
    });
  } catch (error) {
    console.error('Error getting keyword suggestions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
