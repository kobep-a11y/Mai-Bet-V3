#!/usr/bin/env node

/**
 * MAI Bets V3 - Airtable Setup Script
 * Creates strategies and triggers in Airtable
 */

const Airtable = require('airtable');
require('dotenv').config({ path: '.env.local' });

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('❌ Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID in .env.local');
  process.exit(1);
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// Strategy definitions
const STRATEGIES = [
  {
    name: 'Blowout Protection',
    description: 'Teams with 10+ halftime leads maintained a 5+ margin 60 of 71 times (84.5%). Entry when halftime lead >= 10 in Q3/Q4, close when lead drops to 6 or less.',
    triggerMode: 'sequential',
    isActive: true,
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
        name: 'Lead Collapsed - Close',
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
    description: 'Entry when team achieves gap of 13.5+ points. Close when gap comes back to 9.5 or less.',
    triggerMode: 'sequential',
    isActive: true,
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
        name: 'Gap Recovery (9.5 or less)',
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
    description: 'Q3 Gap >= 10, bet Leader -4.5 spread. 94.9% win rate from 1,433 samples.',
    triggerMode: 'sequential',
    isActive: true,
    triggers: [
      {
        name: 'Q3 Gap 10+ Entry',
        conditions: [
          { field: 'quarter', operator: 'equals', value: 3 },
          { field: 'absScoreDifferential', operator: 'greater_than_or_equal', value: 10 }
        ],
        order: 1,
        entryOrClose: 'entry'
      }
    ]
  },
  {
    name: '#4 Lock It In',
    description: 'Q3 Gap >= 15, bet Leader -7.5 spread. 96.4% win rate from 476 samples.',
    triggerMode: 'sequential',
    isActive: true,
    triggers: [
      {
        name: 'Q3 Gap 15+ Entry',
        conditions: [
          { field: 'quarter', operator: 'equals', value: 3 },
          { field: 'absScoreDifferential', operator: 'greater_than_or_equal', value: 15 }
        ],
        order: 1,
        entryOrClose: 'entry'
      }
    ]
  }
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function listFields(tableName) {
  try {
    const records = await base(tableName).select({ maxRecords: 1 }).firstPage();
    if (records.length > 0) {
      console.log(`   Fields in ${tableName}: ${Object.keys(records[0].fields).join(', ')}`);
    } else {
      console.log(`   ${tableName} is empty, can't detect fields`);
    }
    return true;
  } catch (error) {
    console.log(`   ❌ ${tableName}: ${error.message}`);
    return false;
  }
}

async function createStrategy(strategy) {
  try {
    // Try creating strategy record
    const strategyRecord = await base('Strategies').create({
      'Name': strategy.name,
      'Description': strategy.description,
      'Trigger Mode': strategy.triggerMode,
      'Is Active': strategy.isActive,
      'Discord Webhook': ''
    });

    console.log(`   ✅ Created: ${strategy.name} (ID: ${strategyRecord.id})`);

    // Create triggers
    for (const trigger of strategy.triggers) {
      try {
        await base('Triggers').create({
          'Name': trigger.name,
          'Strategy': [strategyRecord.id],
          'Conditions': JSON.stringify(trigger.conditions),
          'Order': trigger.order,
          'Entry Or Close': trigger.entryOrClose
        });
        console.log(`      📌 Trigger: ${trigger.name}`);
      } catch (triggerError) {
        console.log(`      ❌ Trigger error: ${triggerError.message}`);
      }
      await sleep(200);
    }

    return strategyRecord.id;
  } catch (error) {
    console.log(`   ❌ Strategy error for "${strategy.name}": ${error.message}`);

    // If field doesn't exist, show what fields are expected
    if (error.message.includes('Unknown field name')) {
      console.log(`\n   Your Strategies table needs these fields:`);
      console.log(`   - Name (Single line text)`);
      console.log(`   - Description (Long text)`);
      console.log(`   - Trigger Mode (Single line text)`);
      console.log(`   - Is Active (Checkbox)`);
      console.log(`   - Discord Webhook (Long text)\n`);
    }
    return null;
  }
}

async function main() {
  console.log('\n🏀 MAI BETS V3 - AIRTABLE SETUP\n');
  console.log(`Base ID: ${AIRTABLE_BASE_ID}`);
  console.log(`API Key: ${AIRTABLE_API_KEY.substring(0, 20)}...\n`);

  // Check tables
  console.log('📋 Checking tables...\n');
  const strategiesOk = await listFields('Strategies');
  const triggersOk = await listFields('Triggers');

  if (!strategiesOk || !triggersOk) {
    console.log('\n❌ Please make sure Strategies and Triggers tables exist.\n');
    process.exit(1);
  }

  // Check for existing strategies
  console.log('\n📋 Checking existing strategies...\n');
  try {
    const existing = await base('Strategies').select().all();
    if (existing.length > 0) {
      console.log(`   Found ${existing.length} existing strategies:`);
      existing.forEach(r => console.log(`   - ${r.fields.Name || r.fields.name || '(unnamed)'}`));
      console.log('\n   ⚠️  Delete them first if you want to recreate.\n');
      process.exit(0);
    }
  } catch (e) {
    console.log(`   Warning: ${e.message}`);
  }

  // Create strategies
  console.log('\n📋 Creating strategies...\n');

  for (const strategy of STRATEGIES) {
    await createStrategy(strategy);
    await sleep(300);
  }

  // Verify
  console.log('\n📋 Verifying...\n');
  try {
    const final = await base('Strategies').select().all();
    console.log(`   Total strategies: ${final.length}`);
    final.forEach(r => console.log(`   ✅ ${r.fields.Name || r.fields.name}`));
  } catch (e) {
    console.log(`   Error: ${e.message}`);
  }

  console.log('\n✨ Setup complete!\n');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message, '\n');
  process.exit(1);
});
