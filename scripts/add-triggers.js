#!/usr/bin/env node

/**
 * Add triggers for existing strategies
 * Run with: node scripts/add-triggers.js
 */

require('dotenv').config({ path: '.env.local' });
const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

// Trigger definitions for each strategy
const STRATEGY_TRIGGERS = {
  'Blowout Protection': {
    entry: {
      name: 'Blowout Protection - Entry',
      conditions: [
        { field: 'halftimeLead', operator: 'greater_than_or_equal', value: 10 }
      ]
    },
    close: {
      name: 'Blowout Protection - Close',
      conditions: [
        { field: 'currentLead', operator: 'less_than_or_equal', value: 6 }
      ]
    }
  },
  'Version 1 - Gap Recovery': {
    entry: {
      name: 'Gap Recovery - Entry',
      conditions: [
        { field: 'currentLead', operator: 'greater_than_or_equal', value: 13.5 }
      ]
    },
    close: {
      name: 'Gap Recovery - Close',
      conditions: [
        { field: 'currentLead', operator: 'less_than_or_equal', value: 9.5 }
      ]
    }
  },
  '#1 Ultra-Safe': {
    entry: {
      name: 'Ultra-Safe - Entry',
      conditions: [
        { field: 'quarter', operator: 'equals', value: 3 },
        { field: 'currentLead', operator: 'greater_than_or_equal', value: 10 }
      ]
    }
  },
  '#4 Lock It In': {
    entry: {
      name: 'Lock It In - Entry',
      conditions: [
        { field: 'quarter', operator: 'equals', value: 3 },
        { field: 'currentLead', operator: 'greater_than_or_equal', value: 15 }
      ]
    }
  }
};

async function addTriggers() {
  console.log('🔧 Adding triggers for existing strategies...\n');

  try {
    // 1. Get all strategies
    console.log('📋 Fetching strategies...');
    const strategies = await base('Strategies').select().all();
    console.log(`   Found ${strategies.length} strategies\n`);

    // 2. Get existing triggers
    console.log('📋 Fetching existing triggers...');
    const existingTriggers = await base('Triggers').select().all();
    console.log(`   Found ${existingTriggers.length} existing triggers\n`);

    // 3. Create triggers for each strategy
    for (const strategy of strategies) {
      const strategyName = strategy.fields.Name;
      const strategyId = strategy.id;

      console.log(`\n📌 Strategy: ${strategyName} (${strategyId})`);

      const triggerDefs = STRATEGY_TRIGGERS[strategyName];
      if (!triggerDefs) {
        console.log('   ⚠️  No trigger definitions found, skipping');
        continue;
      }

      // Check if triggers already exist for this strategy
      const existingForStrategy = existingTriggers.filter(t => {
        const linkedStrategies = t.fields.Strategy || [];
        return linkedStrategies.includes(strategyId);
      });

      if (existingForStrategy.length > 0) {
        console.log(`   ⚠️  Already has ${existingForStrategy.length} trigger(s), skipping`);
        continue;
      }

      // Create entry trigger
      if (triggerDefs.entry) {
        try {
          const entryRecord = await base('Triggers').create({
            'Name': triggerDefs.entry.name,
            'Strategy': [strategyId],
            'Conditions': JSON.stringify(triggerDefs.entry.conditions),
            'Order': 1,
            'Entry Or Close': 'entry'
          });
          console.log(`   ✅ Created entry trigger: ${triggerDefs.entry.name}`);
        } catch (err) {
          console.log(`   ❌ Entry trigger error: ${err.message}`);
        }
      }

      // Create close trigger if defined
      if (triggerDefs.close) {
        try {
          const closeRecord = await base('Triggers').create({
            'Name': triggerDefs.close.name,
            'Strategy': [strategyId],
            'Conditions': JSON.stringify(triggerDefs.close.conditions),
            'Order': 2,
            'Entry Or Close': 'close'
          });
          console.log(`   ✅ Created close trigger: ${triggerDefs.close.name}`);
        } catch (err) {
          console.log(`   ❌ Close trigger error: ${err.message}`);
        }
      }
    }

    console.log('\n✨ Done adding triggers!');

    // Verify
    console.log('\n📊 Verification:');
    const finalTriggers = await base('Triggers').select().all();
    console.log(`   Total triggers: ${finalTriggers.length}`);

    for (const trigger of finalTriggers) {
      const name = trigger.fields.Name || 'Unnamed';
      const type = trigger.fields['Entry Or Close'] || 'unknown';
      console.log(`   - ${name} (${type})`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.message.includes('NOT_FOUND')) {
      console.log('\n💡 Make sure the Triggers table exists with these fields:');
      console.log('   - Name (Single line text)');
      console.log('   - Strategy (Link to Strategies)');
      console.log('   - Conditions (Long text)');
      console.log('   - Order (Number)');
      console.log('   - Entry Or Close (Single line text)');
    }
  }
}

addTriggers();
