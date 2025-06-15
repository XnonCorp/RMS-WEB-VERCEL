const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function testConnection() {
  console.log('🧪 Testing Supabase connection...');
  
  try {
    // Test Supabase connection by importing and initializing
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test database connection
    const { data, error } = await supabase
      .from('shipments')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.log('⚠️  Database tables not found - please run the schema.sql first');
      console.log('Error:', error.message);
    } else {
      console.log('✅ Supabase connection successful!');
    }
    
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
  }
}

async function testGoogleSheets() {
  console.log('🧪 Testing Google Sheets connection...');
  
  try {
    const { google } = require('googleapis');
    
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_KEY');
    }
    
    if (!process.env.GOOGLE_SHEETS_ID) {
      throw new Error('Missing GOOGLE_SHEETS_ID');
    }
    
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Test reading from both sheets
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    
    const shipmentsTest = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: '2025!A1:A1',
    });
    
    const invoicesTest = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'INVOICE!A1:A1',
    });
    
    console.log('✅ Google Sheets connection successful!');
    console.log(`✅ Found "2025" sheet`);
    console.log(`✅ Found "INVOICE" sheet`);
    
  } catch (error) {
    console.error('❌ Google Sheets connection failed:', error.message);
    
    if (error.message.includes('Unable to parse')) {
      console.log('💡 Tip: Make sure GOOGLE_SERVICE_ACCOUNT_KEY is valid JSON');
    }
    
    if (error.message.includes('not found')) {
      console.log('💡 Tip: Check if the sheet names "2025" and "INVOICE" exist');
    }
  }
}

async function runTests() {
  console.log('🚀 Running connection tests...\n');
  
  await testConnection();
  console.log('');
  await testGoogleSheets();
  
  console.log('\n✨ Test completed!');
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testConnection, testGoogleSheets };
