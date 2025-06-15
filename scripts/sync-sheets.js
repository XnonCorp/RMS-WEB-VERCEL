const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Parse date from various formats
function parseDate(dateStr) {
  if (!dateStr || dateStr === '' || dateStr === '-') return null;
  
  try {
    // Handle Excel serial date numbers
    if (!isNaN(dateStr) && dateStr > 40000) {
      const excelEpoch = new Date(1900, 0, 1);
      const days = parseInt(dateStr) - 2; // Excel bug: treats 1900 as leap year
      const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
      return date.toISOString().split('T')[0];
    }
    
    // Handle various date formats
    let date;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        // Handle MM/DD/YYYY or DD/MM/YYYY
        date = new Date(parts[2], parts[1] - 1, parts[0]);
        if (isNaN(date.getTime())) {
          date = new Date(parts[2], parts[0] - 1, parts[1]);
        }
      }
    } else if (dateStr.includes('-')) {
      date = new Date(dateStr);
    } else {
      date = new Date(dateStr);
    }
    
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  } catch (error) {
    console.log(`Error parsing date: ${dateStr}`, error);
    return null;
  }
}

// Parse datetime from various formats
function parseDateTime(dateTimeStr) {
  if (!dateTimeStr || dateTimeStr === '' || dateTimeStr === '-') return null;
  
  try {
    // Handle Excel serial date numbers with time
    if (!isNaN(dateTimeStr) && dateTimeStr > 40000) {
      const excelEpoch = new Date(1900, 0, 1);
      const days = Math.floor(dateTimeStr) - 2; // Excel bug: treats 1900 as leap year
      const timeFraction = dateTimeStr - Math.floor(dateTimeStr);
      const milliseconds = timeFraction * 24 * 60 * 60 * 1000;
      
      const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000 + milliseconds);
      return date.toISOString();
    }
    
    // Handle various datetime formats
    const date = new Date(dateTimeStr);
    return isNaN(date.getTime()) ? null : date.toISOString();
  } catch (error) {
    console.log(`Error parsing datetime: ${dateTimeStr}`, error);
    return null;
  }
}

// Parse numeric values
function parseNumber(value) {
  if (!value || value === '' || value === '-') return 0;
  
  // Remove currency symbols and formatting
  const cleanValue = value.toString().replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleanValue);
  
  return isNaN(parsed) ? 0 : parsed;
}

// Clean string values
function cleanString(value) {
  if (!value || value === '' || value === '-') return null;
  return value.toString().trim();
}

async function syncGoogleSheetsToSupabase() {
  console.log('🚀 Starting sync process...');
  
  try {
    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId2025 = process.env.GOOGLE_SHEETS_ID_2025;
    const spreadsheetIdInvoice = process.env.GOOGLE_SHEETS_ID_INVOICE;

    console.log('📊 Fetching data from Google Sheets...');
    console.log(`📦 Sheet 2025 ID: ${spreadsheetId2025}`);
    console.log(`💰 Sheet INVOICE ID: ${spreadsheetIdInvoice}`);
    
    // 1. Sync Sheet "2025" to shipments table
    console.log('📦 Processing shipments data...');
    
    const shipmentsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId2025,
      range: '2025!A3:W', // Start from row 3, columns A to W (23 columns)
    });

    const shipmentRows = shipmentsResponse.data.values || [];
    console.log(`Found ${shipmentRows.length} shipment records`);    const shipmentData = shipmentRows
      .filter(row => row[3] && row[3] !== '') // Filter by No SP (kolom D/index 3)
      .map((row, index) => {
        try {
          return {
            // Skip kolom A (No.) - mulai dari kolom B
            pick_up: parseDate(row[1]), // Pick Up (kolom B)
            no_sj: cleanString(row[2]), // No SJ (kolom C)
            no_sp: cleanString(row[3]), // No SP (kolom D)
            customer: cleanString(row[4]), // Customer (kolom E)
            tujuan: cleanString(row[5]), // Tujuan (kolom F)
            via: cleanString(row[6]), // VIA (kolom G)
            qty: parseNumber(row[7]), // QTY (kolom H)
            berat: parseNumber(row[8]), // Berat (kolom I)
            jenis_barang: cleanString(row[9]), // Jenis Barang (kolom J)
            dikirim_oleh: cleanString(row[10]), // Dikirim Oleh (kolom K)
            armada: cleanString(row[11]), // Armada (kolom L)
            ops: cleanString(row[12]), // OPS (kolom M)
            data_armada: cleanString(row[13]), // Data armada (kolom N)
            berangkat: parseDate(row[14]), // Berangkat (kolom O)
            eta: parseDate(row[15]), // ETA (kolom P)
            diterima: parseDate(row[16]), // Diterima (kolom Q)
            penerima: cleanString(row[17]), // Penerima (kolom R)
            qc: cleanString(row[18]), // QC (kolom S)
            waktu_diterima: parseDateTime(row[19]), // Waktu Diterima (kolom T)
            no_smu_bl: cleanString(row[20]), // No SMU / No BL (kolom U)
            no_flight_countr: cleanString(row[21]), // No Flight / No Countr (kolom V)
            do_balik: cleanString(row[22]), // DO Balik (kolom W)
          };
        } catch (error) {
          console.error(`Error processing shipment row ${index + 3}:`, error);
          return null;
        }
      })
      .filter(Boolean); // Remove null entries    // 2. Sync Sheet "INVOICE" to invoices table
    console.log('💰 Processing invoices data...');
    
    const invoicesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdInvoice,
      range: 'INVOICE!B5:I', // Start from row 5, columns B to I (8 columns)
    });

    const invoiceRows = invoicesResponse.data.values || [];
    console.log(`Found ${invoiceRows.length} invoice records`);

    const invoiceData = invoiceRows
      .filter(row => row[4] && row[4] !== '') // Filter by No SP (column F/index 4)
      .map((row, index) => {
        try {
          return {
            no_invoice: cleanString(row[0]), // No. Invoice (column B)
            tanggal_invoice: parseDate(row[1]), // Tanggal Invoice
            nama_customer: cleanString(row[2]), // Nama Customer
            tujuan: cleanString(row[3]), // Tujuan
            no_sp: cleanString(row[4]), // No. SP
            tanggal_pick_up: parseDate(row[5]), // Tanggal Pick Up
            keterangan: cleanString(row[6]), // Keterangan
            no_stt: cleanString(row[7]), // No. STT
          };
        } catch (error) {
          console.error(`Error processing invoice row ${index + 5}:`, error);
          return null;
        }
      })
      .filter(Boolean); // Remove null entries

    // 3. Upsert data to Supabase
    console.log('💾 Upserting data to Supabase...');

    // Upsert shipments
    if (shipmentData.length > 0) {
      const { error: shipmentError } = await supabase
        .from('shipments')
        .upsert(shipmentData, { 
          onConflict: 'no_sp',
          ignoreDuplicates: false 
        });

      if (shipmentError) {
        console.error('Error upserting shipments:', shipmentError);
        throw shipmentError;
      }
      
      console.log(`✅ Successfully upserted ${shipmentData.length} shipments`);
    }

    // Upsert invoices
    if (invoiceData.length > 0) {
      const { error: invoiceError } = await supabase
        .from('invoices')
        .upsert(invoiceData, { 
          onConflict: 'no_sp',
          ignoreDuplicates: false 
        });

      if (invoiceError) {
        console.error('Error upserting invoices:', invoiceError);
        throw invoiceError;
      }
      
      console.log(`✅ Successfully upserted ${invoiceData.length} invoices`);
    }

    // 4. Get final statistics
    const { count: finalShipmentCount } = await supabase
      .from('shipments')
      .select('*', { count: 'exact', head: true });

    const { count: finalInvoiceCount } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true });

    console.log('🎉 Sync completed successfully!');
    console.log(`📦 Total shipments in database: ${finalShipmentCount}`);
    console.log(`💰 Total invoices in database: ${finalInvoiceCount}`);

    return {
      success: true,
      shipmentsProcessed: shipmentData.length,
      invoicesProcessed: invoiceData.length,
      totalShipments: finalShipmentCount,
      totalInvoices: finalInvoiceCount,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  }
}

// Run sync if called directly
if (require.main === module) {
  syncGoogleSheetsToSupabase()
    .then(result => {
      console.log('Sync result:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Sync failed:', error);
      process.exit(1);
    });
}

module.exports = { syncGoogleSheetsToSupabase };
