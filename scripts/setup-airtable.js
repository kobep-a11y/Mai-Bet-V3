#!/usr/bin/env node

/**
 * MAI Bets V3 - Airtable Setup Script
 *
 * This script will:
 * 1. Verify your Airtable tables exist
 * 2. Create the initial strategies with triggers
 * 3. Show you the structure for future strategies
 *
 * Run with: node scripts/setup-airtable.js
 */

const Airtable = require('airtable');
require('dotenv').config({ path: '.env.local' });

// Configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('❌ Missing environment variables!');
  console.error('   Make sure .env.local has:');
  console.error('   AIRTABLE_API_KEY=your_key');
  console.error('   AIRTABLE_BASE_ID=your_base_id');
  process.exit(1);
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// =====================================================
// STRATEGY DEFINITIONS
// =====================================================

const STRATEGIES = [
  {
    name: 'Blowout Protection',
    description: 'Teams with 10+ halftime leads maintained a 5+ margin 60 of 71 times (84.5%). Large leads rarely fully collapse. Entry when halftime lead >= 10 in Q3/Q4, close when lead drops to 6 or less.',
    triggerMode: 'sequential',
    isActive: true,
    discordWebhooks: [],
    triggers: [
      {
        name: 'Large Halftime Lead Entry',
        conditions: [
          { field: 'halftimeDifferential', operator: 'greater_than_or_equal', value: 10 },
          { field: 'quarter', operator: 'greater_than_or_equal', value: 3 }
        ],
        order: 1,
        entryOrClose: 'entry'
      },
      {
        name: 'Lead Collapsed - Close Signal',
        conditions: [
          { field: 'absScoreDifferential', operator: 'less_than_or_equal', value: 6 }
        ],
        order: 2,
        entryOrClose: 'close'
      }
    ]
  },
  {
    name: 'Version 1 - Gap Recovery',
    description: 'Entry when team achieves gap of 13.5+ points. Second trigger when gap comes back to 9.5 or less. Take -7.5 to -1.5 spread expecting game to end with 8+ point margin.',
    triggerMode: 'sequential',
    isActive: true,
    discordWebhooks: [],
    triggers: [
      {
        name: 'Large Gap Entry (13.5+)',
        conditions: [
          { field: 'absScoreDifferential', operator: 'greater_than_or_equal', value: 14 },
          { field: 'quarter', operator: 'greater_than_or_equal', value: 2 }
        ],
        order: 1,
        entryOrClose: 'entry'
      },
      {
        name: 'Gap Recovery Signal (9.5 or less)',
        conditions: [
          { field: 'absScoreDifferential', operator: 'less_than_or_equal', value: 10 },
          { field: 'quarter', operator: 'greater_than_or_equal', value: 3 }
        ],
        order: 2,
        entryOrClose: 'close'
      }
    ]
  },
  {
    name: '#1 Ultra-Safe',
    description: 'Q3 Gap >= 10, bet Leader -4.5 spread. 94.9% win rate from 1,433 samples. Trigger after Q3.',
    triggerMode: 'sequential',
    isActive: true,
    discordWebhooks: [],
    triggers: [
      {
        name: 'Q3 Gap 10+ Entry',
        conditions: [
          { field: 'quarter', operator: 'equals', value: 3 },
          { field: 'absScoreDifferential', operator: 'greater_than_or_equal', value: 10 }
        ],
        order: 1,
        entryOrClose: 'entry'
      },
      {
        name: 'Q4 Confirmation (maintain 5+ lead)',
        conditions: [
          { field: 'quarter', operator: 'equals', value: 4 },
          { field: 'absScoreDifferential', operator: 'greater_than_or_equal', value: 5 }
        ],
        order: 2,
        entryOrClose: 'close'
      }
    ]
  },
  {
    name: '#4 Lock It In',
    description: 'Q3 Gap >= 15, bet Leader -7.5 spread. 96.4% win rate from 476 samples. High confidence play triggered after Q3.',
    triggerMode: 'sequential',
    isActive: true,
    discordWebhooks: [],
    triggers: [
      {
        name: 'Q3 Gap 15+ Entry',
        conditions: [
          { field: 'quarter', operator: 'equals', value: 3 },
          { field: 'absScoreDifferential', operator: 'greater_than_or_equal', value: 15 }
        ],
        order: 1,
        entryOrClose: 'entry'
      },
      {
        name: 'Q4 Confirmation (maintain 8+ lead)',
        conditions: [
          { field: 'quarter', operator: 'equals', value: 4 },
          { field: 'absScoreDifferential', operator: 'greater_than_or_equal', value: 8 }
        ],
        order: 2,
        entryOrClose: 'close'
      }
    ]
  }
];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyTable(tableName) {
  try {
    await base(tableName).select({ maxRecords: 1 }).firstPage();
    return { exists: true, error: null };
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

async function getExistingStrategies() {
  try {
    const records = await base('Strategies').select().all();
    return records.map(r => ({ id: r.id, name: r.fields.Name }));
  } catch (error) {
    return [];
  }
}

async function createStrategy(strategyDef) {
  // Create the strategy record
  const strategyRecord = await base('Strategies').create({
    'Name': strategyDef.name,
    'Description': strategyDef.description,
    'Trigger Mode': strategyDef.triggerMode,
    'Is Active': strategyDef.isActive,
    'Discord Webhooks': JSON.stringify(strategyDef.discordWebhooks)
  });

  const strategyId = strategyRecord.id;
  console.log(`   ✅ Created strategy: ${strategyDef.name} (${strategyId})`);

  // Create triggers for this strategy
  for (const trigger of strategyDef.triggers) {
    await base('Triggers').create({
      'Name': trigger.name,
      'Strategy': [strategyId],
      'Conditions': JSON.stringify(trigger.conditions),
      'Order': trigger.order,
      'Entry Or Close': trigger.entryOrClose
    });
    console.log(`      📌 Created trigger: ${trigger.name}`);
    await sleep(200); // Rate limiting
  }

  return strategyId;
}

// =====================================================
// MAIN EXECUTION
// =====================================================

async function main() {
  console.log('');
  console.log('🏀 MAI BETS V3 - AIRTABLE SETUP');
  console.log('================================');
  console.log('');
  console.log(`📊 Base ID: ${AIRTABLE_BASE_ID}`);
  console.log(`🔑 API Key: ${AIRTABLE_API_KEY.substring(0, 15)}...`);
  console.log('');

  // Step 1: Verify tables exist
  console.log('📋 STEP 1: Verifying Airtable tables...');
  console.log('');

  const tables = ['Strategies', 'Triggers', 'Signals', 'Historical Games'];
  let allTablesExist = true;

  for (const table of tables) {
    const result = await verifyTable(table);
    if (result.exists) {
      console.log(`   ✅ ${table} - OK`);
    } else {
      console.log(`   ❌ ${table} - NOT FOUND`);
      console.log(`      Error: ${result.error}`);
      allTablesExist = false;
    }
  }

  if (!allTablesExist) {
    console.log('');
    console.log('❌ Some tables are missing. Please create them in Airtable first.');
    console.log('');
    console.log('Required tables:');
    console.log('  1. Strategies - with fields: Name, Description, Trigger Mode, Is Active, Discord Webhooks');
    console.log('  2. Triggers - with fields: Name, Strategy (link), Conditions, Order, Entry Or Close');
    console.log('  3. Signals - with fields: Name, Strategy (link), Game ID, Status, etc.');
    console.log('  4. Historical Games - with fields: Name, Home Team, Away Team, scores, etc.');
    process.exit(1);
  }

  console.log('');
  console.log('✅ All tables verified!');
  console.log('');

  // Step 2: Check for existing strategies
  console.log('📋 STEP 2: Checking for existing strategies...');
  console.log('');

  const existing = await getExistingStrategies();

  if (existing.length > 0) {
    console.log(`   Found ${existing.length} existing strategies:`);
    existing.forEach(s => console.log(`      - ${s.name} (${s.id})`));
    console.log('');
    console.log('   ⚠️  Skipping creation to avoid duplicates.');
    console.log('   To recreate, delete existing strategies in Airtable first.');
    console.log('');
  } else {
    // Step 3: Create strategies
    console.log('📋 STEP 3: Creating strategies and triggers...');
    console.log('');

    for (const strategy of STRATEGIES) {
      await createStrategy(strategy);
      await sleep(300); // Rate limiting between strategies
    }

    console.log('');
    console.log('✅ All strategies created!');
    console.log('');
  }

  // Step 4: Show summary
  console.log('📋 SUMMARY');
  console.log('==========');
  console.log('');

  const finalStrategies = await getExistingStrategies();
  console.log(`Total strategies in Airtable: ${finalStrategies.length}`);
  console.log('');

  finalStrategies.forEach(s => {
    console.log(`📌 ${s.name}`);
    console.log(`   ID: ${s.id}`);
  });

  console.log('');
  console.log('🎯 NEXT STEPS:');
  console.log('');
  console.log('1. Add Discord webhooks to each strategy in Airtable:');
  console.log('   - Open each strategy in Airtable');
  console.log('   - In "Discord Webhooks" field, paste:');
  console.log('     [{"url": "YOUR_WEBHOOK_URL", "name": "Main Channel", "isActive": true}]');
  console.log('');
  console.log('2. Deploy your app:');
  console.log('   git add -A && git commit -m "Phase 1 complete" && git push');
  console.log('');
  console.log('3. Test with a live game or demo game on your site');
  console.log('');
  console.log('✨ Setup complete!');
}

main().catch(err => {
  console.error('');
  console.error('❌ Error:', err.message);
  process.exit(1);
});
