#!/usr/bin/env node

/**
 * Setup Strategies V2 - Complete setup with flexible odds requirements
 *
 * This script:
 * 1. Updates existing strategies with odds requirements (spread, moneyline, totals)
 * 2. Creates entry and close triggers for each strategy
 *
 * Run with: node scripts/setup-strategies-v2.js
 */

require('dotenv').config({ path: '.env.local' });
const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

// Complete strategy definitions with triggers and flexible odds requirements
const STRATEGY_DEFINITIONS = {
  'Blowout Protection': {
    description: 'Teams with 10+ halftime lead, bet when lead drops to 6 or less',
    isTwoStage: true,
    oddsType: 'spread',
    oddsValue: -4.5,
    betSide: 'leading_team',
    triggers: {
      entry: {
        name: 'Blowout Protection - Entry',
        conditions: [
          { field: 'halftimeDifferential', operator: 'greater_than_or_equal', value: 10 }
        ],
        order: 1
      },
      close: {
        name: 'Blowout Protection - Close',
        conditions: [
          { field: 'absScoreDifferential', operator: 'less_than_or_equal', value: 6 }
        ],
        order: 2
      }
    }
  },
  'Version 1 - Gap Recovery': {
    description: 'Entry when team achieves 13.5+ lead, close when lead drops to 9.5 or less',
    isTwoStage: true,
    oddsType: 'spread',
    oddsValue: -7.5,
    betSide: 'leading_team',
    triggers: {
      entry: {
        name: 'Gap Recovery - Entry',
        conditions: [
          { field: 'absScoreDifferential', operator: 'greater_than_or_equal', value: 13.5 }
        ],
        order: 1
      },
      close: {
        name: 'Gap Recovery - Close',
        conditions: [
          { field: 'absScoreDifferential', operator: 'less_than_or_equal', value: 9.5 }
        ],
        order: 2
      }
    }
  },
  '#1 Ultra-Safe': {
    description: 'Q3 Gap >= 10, bet Leader. 94.9% win rate strategy.',
    isTwoStage: false,
    oddsType: 'spread',
    oddsValue: -4.5,
    betSide: 'leading_team',
    triggers: {
      entry: {
        name: 'Ultra-Safe - Entry',
        conditions: [
          { field: 'quarter', operator: 'equals', value: 3 },
          { field: 'absScoreDifferential', operator: 'greater_than_or_equal', value: 10 }
        ],
        order: 1
      }
    }
  },
  '#4 Lock It In': {
    description: 'Q3 Gap >= 15, bet Leader. 96.4% win rate strategy.',
    isTwoStage: false,
    oddsType: 'spread',
    oddsValue: -7.5,
    betSide: 'leading_team',
    triggers: {
      entry: {
        name: 'Lock It In - Entry',
        conditions: [
          { field: 'quarter', operator: 'equals', value: 3 },
          { field: 'absScoreDifferential', operator: 'greater_than_or_equal', value: 15 }
        ],
        order: 1
      }
    }
  }
};

async function setupStrategies() {
  console.log('🚀 MAI Bets V3 - Strategy Setup with Flexible Odds Requirements\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Fetch existing strategies
    console.log('\n📋 Fetching existing strategies...');
    const strategies = await base('Strategies').select().all();
    console.log(`   Found ${strategies.length} strategies`);

    // Step 2: Fetch existing triggers
    console.log('\n📋 Fetching existing triggers...');
    const existingTriggers = await base('Triggers').select().all();
    console.log(`   Found ${existingTriggers.length} existing triggers`);

    // Step 3: Process each strategy
    for (const strategy of strategies) {
      const strategyName = strategy.fields.Name;
      const strategyId = strategy.id;
      const definition = STRATEGY_DEFINITIONS[strategyName];

      console.log(`\n${'─'.repeat(60)}`);
      console.log(`📌 Strategy: ${strategyName}`);
      console.log(`   ID: ${strategyId}`);

      if (!definition) {
        console.log('   ⚠️  No definition found, skipping');
        continue;
      }

      // Step 3a: Update strategy with odds requirements
      console.log('\n   Updating odds requirements...');
      try {
        await base('Strategies').update(strategyId, {
          'Odds Type': definition.oddsType,
          'Odds Value': definition.oddsValue,
          'Bet Side': definition.betSide,
          'Is Two Stage': definition.isTwoStage,
          'Expiry Time Q4': '2:20'
        });
        console.log(`   ✅ Updated:`);
        console.log(`      Odds Type: ${definition.oddsType}`);
        console.log(`      Odds Value: ${definition.oddsValue}`);
        console.log(`      Bet Side: ${definition.betSide}`);
        console.log(`      Two Stage: ${definition.isTwoStage}`);
      } catch (err) {
        console.log(`   ⚠️  Could not update odds requirements: ${err.message}`);
        console.log('   💡 Add these fields to the Strategies table in Airtable:');
        console.log('      - Odds Type (Single Select: spread, moneyline, total_over, total_under)');
        console.log('      - Odds Value (Number)');
        console.log('      - Bet Side (Single Select: leading_team, trailing_team, home, away)');
        console.log('      - Is Two Stage (Checkbox)');
        console.log('      - Expiry Time Q4 (Single line text)');
      }

      // Step 3b: Check for existing triggers
      const existingForStrategy = existingTriggers.filter(t => {
        const linkedStrategies = t.fields.Strategy || [];
        return linkedStrategies.includes(strategyId);
      });

      if (existingForStrategy.length > 0) {
        console.log(`\n   ℹ️  Already has ${existingForStrategy.length} trigger(s):`);
        existingForStrategy.forEach(t => {
          console.log(`      - ${t.fields.Name} (${t.fields['Entry Or Close'] || 'unknown'})`);
        });
        console.log('   Skipping trigger creation');
        continue;
      }

      // Step 3c: Create triggers
      console.log('\n   Creating triggers...');

      // Entry trigger
      if (definition.triggers.entry) {
        try {
          await base('Triggers').create({
            'Name': definition.triggers.entry.name,
            'Strategy': [strategyId],
            'Conditions': JSON.stringify(definition.triggers.entry.conditions),
            'Order': definition.triggers.entry.order,
            'Entry Or Close': 'entry'
          });
          console.log(`   ✅ Created: ${definition.triggers.entry.name}`);
        } catch (err) {
          console.log(`   ❌ Entry trigger error: ${err.message}`);
          if (err.message.includes('Insufficient permissions')) {
            console.log('   💡 Add "entry" and "close" options to the "Entry Or Close" field in Airtable');
          }
        }
      }

      // Close trigger (for two-stage strategies)
      if (definition.triggers.close) {
        try {
          await base('Triggers').create({
            'Name': definition.triggers.close.name,
            'Strategy': [strategyId],
            'Conditions': JSON.stringify(definition.triggers.close.conditions),
            'Order': definition.triggers.close.order,
            'Entry Or Close': 'close'
          });
          console.log(`   ✅ Created: ${definition.triggers.close.name}`);
        } catch (err) {
          console.log(`   ❌ Close trigger error: ${err.message}`);
        }
      }
    }

    // Step 4: Verification
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 VERIFICATION\n');

    const finalStrategies = await base('Strategies').select().all();
    const finalTriggers = await base('Triggers').select().all();

    console.log('Strategies with Odds Requirements:');
    console.log('─'.repeat(40));
    for (const s of finalStrategies) {
      const oddsType = s.fields['Odds Type'];
      const oddsValue = s.fields['Odds Value'];
      const betSide = s.fields['Bet Side'];
      const isTwoStage = s.fields['Is Two Stage'];

      console.log(`\n  📌 ${s.fields.Name}`);
      console.log(`     Odds Type: ${oddsType || '⚠️ NOT SET'}`);
      console.log(`     Odds Value: ${oddsValue !== undefined ? oddsValue : '⚠️ NOT SET'}`);
      console.log(`     Bet Side: ${betSide || '⚠️ NOT SET'}`);
      console.log(`     Two Stage: ${isTwoStage !== undefined ? (isTwoStage ? 'Yes' : 'No') : '⚠️ NOT SET'}`);
    }

    console.log('\n\nTriggers:');
    console.log('─'.repeat(40));
    for (const t of finalTriggers) {
      const type = t.fields['Entry Or Close'] || 'unknown';
      console.log(`  - ${t.fields.Name} (${type})`);
    }

    console.log('\n✨ Setup complete!');
    console.log('\n' + '='.repeat(60));
    console.log('FLEXIBLE ODDS TYPES SUPPORTED:');
    console.log('─'.repeat(40));
    console.log('  spread      → actual >= value (e.g., -3.5 >= -4.5 ✓)');
    console.log('  moneyline   → actual >= value (e.g., -140 >= -150 ✓)');
    console.log('  total_over  → actual <= value (e.g., 205 <= 210 ✓)');
    console.log('  total_under → actual >= value (e.g., 215 >= 210 ✓)');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

setupStrategies();
