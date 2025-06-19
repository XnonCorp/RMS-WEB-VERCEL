const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// === SETUP DATABASE FOR OPTIMIZED SYNC ===
async function setupDatabase() {
  console.log('🔧 Setting up database for optimized sync...');
  console.log('');
  console.log('⚠️  MANUAL SETUP REQUIRED:');
  console.log('');
  console.log('1. Open Supabase Dashboard → SQL Editor');
  console.log('2. Run the following SQL commands:');
  console.log('');
  console.log('-- Add row_hash columns for optimization');
  console.log('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS row_hash VARCHAR(32);');
  console.log('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS row_hash VARCHAR(32);');
  console.log('');
  console.log('-- Add indexes for better performance');
  console.log('CREATE INDEX IF NOT EXISTS idx_shipments_row_hash ON shipments(row_hash);');
  console.log('CREATE INDEX IF NOT EXISTS idx_invoices_row_hash ON invoices(row_hash);');
  console.log('');
  console.log('-- Function to auto-generate hashes');
  console.log(`CREATE OR REPLACE FUNCTION auto_update_hash()
RETURNS TRIGGER AS $$
DECLARE
  row_data JSONB;
BEGIN
  row_data := to_jsonb(NEW) - 'id' - 'created_at' - 'updated_at' - 'row_hash';
  NEW.row_hash := md5(row_data::text);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;`);
  console.log('');
  console.log('-- Create triggers');
  console.log('DROP TRIGGER IF EXISTS trigger_shipments_hash_update ON shipments;');
  console.log(`CREATE TRIGGER trigger_shipments_hash_update
  BEFORE INSERT OR UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION auto_update_hash();`);
  console.log('');
  console.log('DROP TRIGGER IF EXISTS trigger_invoices_hash_update ON invoices;');
  console.log(`CREATE TRIGGER trigger_invoices_hash_update
  BEFORE INSERT OR UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION auto_update_hash();`);
  console.log('');
  console.log('-- Populate existing records with hashes');
  console.log(`DO $$
DECLARE
  rec RECORD;
  row_data JSONB;
  hash_value VARCHAR(32);
BEGIN
  -- Update shipments
  FOR rec IN SELECT * FROM shipments WHERE row_hash IS NULL LOOP
    row_data := to_jsonb(rec) - 'id' - 'created_at' - 'updated_at' - 'row_hash';
    hash_value := md5(row_data::text);
    UPDATE shipments SET row_hash = hash_value WHERE id = rec.id;
  END LOOP;
  
  -- Update invoices
  FOR rec IN SELECT * FROM invoices WHERE row_hash IS NULL LOOP
    row_data := to_jsonb(rec) - 'id' - 'created_at' - 'updated_at' - 'row_hash';
    hash_value := md5(row_data::text);
    UPDATE invoices SET row_hash = hash_value WHERE id = rec.id;
  END LOOP;
  
  RAISE NOTICE 'Hash population completed';
END $$;`);
  console.log('');
  console.log('3. After running the SQL, test with: npm run test-connection');
  console.log('');
  
  return { success: true, manual: true };
}

// === TEST DATABASE CONNECTION ===
async function testConnection() {
  console.log('🧪 Testing connections...');
  
  try {
    // Test Supabase
    const { data, error } = await supabase
      .from('shipments')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    
    // Test Google Sheets
    const { google } = require('googleapis');
    
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      console.error('❌ Missing GOOGLE_SERVICE_ACCOUNT_KEY');
      return false;
    }
    
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID_2025,
      range: '2025!A1:A1',
    });
    
    await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID_INVOICE,
      range: 'INVOICE!A1:A1',
    });
    
    console.log('✅ Google Sheets connection successful');
    
    return true;
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

// === CLEANUP (Remove optimization) ===
async function cleanup() {
  console.log('🧹 Cleaning up optimization...');
  console.log('');
  console.log('⚠️  MANUAL CLEANUP REQUIRED:');
  console.log('');
  console.log('Run these SQL commands in Supabase Dashboard → SQL Editor:');
  console.log('');
  console.log('DROP TRIGGER IF EXISTS trigger_shipments_hash_update ON shipments;');
  console.log('DROP TRIGGER IF EXISTS trigger_invoices_hash_update ON invoices;');
  console.log('DROP FUNCTION IF EXISTS auto_update_hash();');
  console.log('ALTER TABLE shipments DROP COLUMN IF EXISTS row_hash;');
  console.log('ALTER TABLE invoices DROP COLUMN IF EXISTS row_hash;');
  console.log('');
  
  return { success: true, manual: true };
}

// CLI usage
if (require.main === module) {
  const command = process.argv[2] || 'setup';
  
  switch (command) {
    case 'setup':
      setupDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
    case 'test':
      testConnection()
        .then(success => process.exit(success ? 0 : 1));
      break;
    case 'cleanup':
      cleanup()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
    default:
      console.log('Usage:');
      console.log('  node setup-db.js setup    # Setup database for optimized sync');
      console.log('  node setup-db.js test     # Test connections');
      console.log('  node setup-db.js cleanup  # Remove optimization');
      process.exit(1);
  }
}

module.exports = { setupDatabase, testConnection, cleanup };
