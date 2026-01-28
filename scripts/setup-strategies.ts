/**
 * Setup Script: Verify Airtable & Create Initial Strategies
 *
 * Run with: npx ts-node --skip-project scripts/setup-strategies.ts
 * Or: npx tsx scripts/setup-strategies.ts
 */

import Airtable from 'airtable';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('❌ Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID in .env.local');
  process.exit(1);
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// ============================================
// STRATEGY DEFINITIONS
// ============================================

const strategies = [
  {
    name: 'Blowout Protection',
    description: 'Teams with 10+ halftime leads maintained a 5+ margin 60 of 71 times (84.5%). Large leads rarely fully collapse. Entry when halftime lead >= 10 in Q3/Q4, close when lead drops to 6 or less.',
    triggerMode: 'sequential',
    isActive: true,
    discordWebhooks: [], // Will be set via API later
    triggers: [
      {
        name: 'Large Halftime Lead Entry',
        conditions: [
          { field: 'halftimeDifferential', operator: 'greater_than_or_equal', value: 10 },
          { field: 'quarter', operator: 'greater_than_or_equal', value: 3 },
        ],
        order: 1,
        entryOrClose: 'entry',
      },
      {
        name: 'Lead Collapsed Close',
        conditions: [
          { field: 'absScoreDifferential', operator: 'less_than_or_equal', value: 6 },
        ],
        order: 2,
        entryOrClose: 'close',
      },
    ],
  },
  {
    name: 'Version 1 - Gap Recovery',
    description: 'Based on gap at halftime spread coming back within range. Entry when team achieves gap of 13.5+ points, then second trigger when gap comes back to 9.5 or less. Take -7.5 to -1.5 spread with expectation of game ending with 8+ point margin.',
    triggerMode: 'sequential',
    isActive: true,
    discordWebhooks: [],
    triggers: [
      {
        name: 'Large Gap Entry (13.5+)',
        conditions: [
          { field: 'absScoreDifferential', operator: 'greater_than_or_equal', value: 14 },
          { field: 'quarter', operator: 'greater_than_or_equal', value: 2 },
        ],
        order: 1,
        entryOrClose: 'entry',
      },
      {
        name: 'Gap Recovery Signal (9.5 or less)',
        conditions: [
          { field: 'absScoreDifferential', operator: 'less_than_or_equal', value: 10 },
          { field: 'quarter', operator: 'greater_than_or_equal', value: 3 },
        ],
        order: 2,
        entryOrClose: 'close', // This signals to take the bet
      },
    ],
  },
  {
    name: '#1 Ultra-Safe',
    description: 'Q3 Gap >= 10, bet Leader -4.5 spread. 94.9% win rate from 1,433 sample. Trigger after Q3.',
    triggerMode: 'sequential',
    isActive: true,
    discordWebhooks: [],
    triggers: [
      {
        name: 'Q3 Gap 10+ Entry',
        conditions: [
          { field: 'quarter', operator: 'equals', value: 3 },
          { field: 'absScoreDifferential', operator: 'greater_than_or_equal', value: 10 },
        ],
        order: 1,
        entryOrClose: 'entry',
      },
      {
        name: 'End of Q3 Confirmation',
        conditions: [
          { field: 'quarter', operator: 'equals', value: 4 },
          { field: 'absScoreDifferential', operator: 'greater_than_or_equal', value: 5 },
        ],
        order: 2,
        entryOrClose: 'close',
      },
    ],
  },
  {
    name: '#4 Lock It In',
    description: 'Q3 Gap >= 15, bet Leader -7.5 spread. 96.4% win rate from 476 sample. Trigger after Q3. High confidence play.',
    triggerMode: 'sequential',
    isActive: true,
    discordWebhooks: [],
    triggers: [
      {
        name: 'Q3 Gap 15+ Entry',
        conditions: [
          { field: 'quarter', operator: 'equals', value: 3 },
          { field: 'absScoreDifferential', operator: 'greater_than_or_equal', value: 15 },
        ],
        order: 1,
        entryOrClose: 'entry',
      },
      {
        name: 'Maintain Lead Confirmation',
        conditions: [
          { field: 'quarter', operator: 'equals', value: 4 },
          { field: 'absScoreDifferential', operator: 'greater_than_or_equal', value: 8 },
        ],
        order: 2,
        entryOrClose: 'close',
      },
    ],
  },
];

// ============================================
// VERIFICATION FUNCTIONS
// ============================================

async function verifyTable(tableName: string, requiredFields: string[]): Promise<boolean> {
  console.log(`\n📋 Checking table: ${tableName}`);

  try {
    // Try to fetch one record to verify table exists
    const records = await base(tableName).select({ maxRecords: 1 }).firstPage();
    console.log(`   ✅ Table "${tableName}" exists`);

    // If there are records, check fields
    if (records.length > 0) {
      const existingFields = Object.keys(records[0].fields);
      console.log(`   📝 Found fields: ${existingFields.join(', ')}`);

      const missingFields = requiredFields.filter(f => !existingFields.includes(f));
      if (missingFields.length > 0) {
        console.log(`   ⚠️  Missing fields: ${missingFields.join(', ')}`);
      }
    } else {
      console.log(`   📝 Table is empty (will verify fields when data is added)`);
    }

    return true;
  } catch (error: any) {
    if (error.message?.includes('Could not find table')) {
      console.log(`   ❌ Table "${tableName}" NOT FOUND`);
    } else {
      console.log(`   ❌ Error: ${error.message}`);
    }
    return false;
  }
}

async function verifyAirtable(): Promise<boolean> {
  console.log('\n🔍 VERIFYING AIRTABLE CONFIGURATION');
  console.log('====================================');

  const tables = [
    {
      name: 'Strategies',
      fields: ['Name', 'Description', 'Trigger Mode', 'Is Active', 'Discord Webhooks'],
    },
    {
      name: 'Triggers',
      fields: ['Name', 'Strategy', 'Conditions', 'Order', 'Entry Or Close'],
    },
    {
      name: 'Signals',
      fields: ['Name', 'Strategy', 'Strategy Name', 'Game ID', 'Home Team', 'Away Team', 'Status'],
    },
    {
      name: 'Historical Games',
      fields: ['Name', 'Home Team', 'Away Team', 'Home Score', 'Away Score', 'Winner'],
    },
  ];

  let allGood = true;

  for (const table of tables) {
    const exists = await verifyTable(table.name, table.fields);
    if (!exists) allGood = false;
  }

  return allGood;
}

// ============================================
// CREATION FUNCTIONS
// ============================================

async function createStrategy(strategy: typeof strategies[0]): Promise<string | null> {
  console.log(`\n🎯 Creating strategy: ${strategy.name}`);

  try {
    // Create the strategy
    const record = await base('Strategies').create({
      'Name': strategy.name,
      'Description': strategy.description,
      'Trigger Mode': strategy.triggerMode,
      'Is Active': strategy.isActive,
      'Discord Webhooks': JSON.stringify(strategy.discordWebhooks),
    });

    const strategyId = record.id;
    console.log(`   ✅ Strategy created: ${strategyId}`);

    // Create triggers for this strategy
    for (const trigger of strategy.triggers) {
      await base('Triggers').create({
        'Name': trigger.name,
        'Strategy': [strategyId],
        'Conditions': JSON.stringify(trigger.conditions),
        'Order': trigger.order,
        'Entry Or Close': trigger.entryOrClose,
      });
      console.log(`   ✅ Trigger created: ${trigger.name}`);
    }

    return strategyId;
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function createAllStrategies(): Promise<void> {
  console.log('\n🚀 CREATING STRATEGIES');
  console.log('======================');

  for (const strategy of strategies) {
    await createStrategy(strategy);
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 250));
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('🏀 MAI BETS V3 - SETUP SCRIPT');
  console.log('==============================\n');
  console.log(`Base ID: ${AIRTABLE_BASE_ID}`);
  console.log(`API Key: ${AIRTABLE_API_KEY?.slice(0, 10)}...`);

  // Step 1: Verify Airtable
  const isValid = await verifyAirtable();

  if (!isValid) {
    console.log('\n❌ Airtable verification failed. Please fix the issues above.');
    console.log('\nRequired tables:');
    console.log('  - Strategies');
    console.log('  - Triggers');
    console.log('  - Signals');
    console.log('  - Historical Games');
    process.exit(1);
  }

  console.log('\n✅ Airtable verification passed!');

  // Step 2: Check if strategies already exist
  const existingStrategies = await base('Strategies').select().all();

  if (existingStrategies.length > 0) {
    console.log(`\n⚠️  Found ${existingStrategies.length} existing strategies:`);
    existingStrategies.forEach(s => console.log(`   - ${s.fields.Name}`));
    console.log('\nSkipping strategy creation to avoid duplicates.');
    console.log('To recreate, delete existing strategies first.');
  } else {
    // Step 3: Create strategies
    await createAllStrategies();
  }

  console.log('\n✨ SETUP COMPLETE!');
  console.log('\nNext steps:');
  console.log('1. Add Discord webhook URLs to each strategy via the API or Airtable UI');
  console.log('2. Push your code changes: git add -A && git commit -m "Phase 1 complete" && git push');
  console.log('3. Test with a demo game on the live site');
}

main().catch(console.error);
