/**
 * Setup script to create the Active Games table in Airtable
 *
 * Run with: node scripts/setup-active-games-table.js
 *
 * Required environment variables:
 * - AIRTABLE_API_KEY
 * - AIRTABLE_BASE_ID
 */

require('dotenv').config();
const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);

async function createTestRecord() {
  console.log('Creating test record in Active Games table...');
  console.log('(If the table does not exist, you will need to create it manually in Airtable)');
  console.log('');
  console.log('Required fields for "Active Games" table:');
  console.log('  - Event ID (Single line text) - Primary field');
  console.log('  - Home Team (Single line text)');
  console.log('  - Away Team (Single line text)');
  console.log('  - Home Score (Number)');
  console.log('  - Away Score (Number)');
  console.log('  - Quarter (Number)');
  console.log('  - Time Remaining (Single line text)');
  console.log('  - Status (Single select: scheduled, live, halftime, final)');
  console.log('  - Spread (Number)');
  console.log('  - ML Home (Number)');
  console.log('  - ML Away (Number)');
  console.log('  - Total (Number)');
  console.log('  - League (Single line text)');
  console.log('  - Last Update (Date/Time)');
  console.log('  - Raw Data (Long text)');
  console.log('');

  try {
    const record = await base('Active Games').create({
      'Event ID': 'test-setup-' + Date.now(),
      'Home Team': 'Test Home Team',
      'Away Team': 'Test Away Team',
      'Home Score': 0,
      'Away Score': 0,
      'Quarter': 1,
      'Time Remaining': '12:00',
      'Status': 'scheduled',
      'Spread': -3.5,
      'ML Home': -150,
      'ML Away': 130,
      'Total': 185.5,
      'League': 'NBA2K',
      'Last Update': new Date().toISOString(),
      'Raw Data': '{}',
    });

    console.log('✅ Test record created successfully!');
    console.log('   Record ID:', record.id);
    console.log('');
    console.log('Cleaning up test record...');

    await base('Active Games').destroy(record.id);
    console.log('✅ Test record deleted.');
    console.log('');
    console.log('Active Games table is ready to use!');
  } catch (error) {
    if (error.message.includes('Could not find table')) {
      console.log('');
      console.log('❌ Table "Active Games" does not exist.');
      console.log('');
      console.log('Please create it manually in Airtable with the fields listed above.');
      console.log('');
      console.log('Quick setup:');
      console.log('1. Go to your Airtable base');
      console.log('2. Click "+ Add or import" to create a new table');
      console.log('3. Name it "Active Games"');
      console.log('4. Add the fields listed above');
    } else {
      console.error('Error:', error.message);
    }
  }
}

createTestRecord();
