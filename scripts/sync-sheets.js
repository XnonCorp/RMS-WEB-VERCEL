const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Clean and return string values (no parsing)
function cleanString(value) {
  if (!value || value === '' || value === '-') return null;
  const cleaned = value.toString().trim();
  // Additional safety check for problematic values
  if (cleaned === 'undefined' || cleaned === 'null') return null;
  return cleaned;
}

// Debug function to log problematic data
function debugData(data, label) {
  console.log(`🔍 Debugging ${label}:`, {
    count: data.length,
    sample: data.slice(0, 3).map(item => ({
      no_sp: item.no_sp,
      qty: item.qty,
      customer: item.customer
    }))
  });
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
      .map((row, index) => {        try {
          return {
            // Skip kolom A (No.) - mulai dari kolom B
            pick_up: cleanString(row[1]), // Pick Up (kolom B)
            no_sj: cleanString(row[2]), // No SJ (kolom C)
            no_sp: cleanString(row[3]), // No SP (kolom D)
            customer: cleanString(row[4]), // Customer (kolom E)
            tujuan: cleanString(row[5]), // Tujuan (kolom F)
            via: cleanString(row[6]), // VIA (kolom G)
            qty: cleanString(row[7]), // QTY (kolom H)
            berat: cleanString(row[8]), // Berat (kolom I)
            jenis_barang: cleanString(row[9]), // Jenis Barang (kolom J)
            dikirim_oleh: cleanString(row[10]), // Dikirim Oleh (kolom K)
            armada: cleanString(row[11]), // Armada (kolom L)
            ops: cleanString(row[12]), // OPS (kolom M)
            data_armada: cleanString(row[13]), // Data armada (kolom N)
            berangkat: cleanString(row[14]), // Berangkat (kolom O)
            eta: cleanString(row[15]), // ETA (kolom P)
            diterima: cleanString(row[16]), // Diterima (kolom Q)
            penerima: cleanString(row[17]), // Penerima (kolom R)
            qc: cleanString(row[18]), // QC (kolom S)
            waktu_diterima: cleanString(row[19]), // Waktu Diterima (kolom T)
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
    console.log(`Found ${invoiceRows.length} invoice records`);    const invoiceData = invoiceRows
      .filter(row => row[4] && row[4] !== '' && row[4] !== null && row[4].toString().trim() !== '') // Filter by No SP (column F/index 4)
      .map((row, index) => {        try {
          const no_sp = cleanString(row[4]); // No. SP
          
          // Double-check no_sp is not null/empty after cleaning
          if (!no_sp || no_sp === '') {
            console.warn(`Skipping invoice row ${index + 5}: no_sp is empty after cleaning`);
            return null;
          }
          
          return {
            no_invoice: cleanString(row[0]), // No. Invoice (column B)
            tanggal_invoice: cleanString(row[1]), // Tanggal Invoice
            nama_customer: cleanString(row[2]), // Nama Customer
            tujuan: cleanString(row[3]), // Tujuan
            no_sp: no_sp, // No. SP (validated)
            tanggal_pick_up: cleanString(row[5]), // Tanggal Pick Up
            keterangan: cleanString(row[6]), // Keterangan
            no_stt: cleanString(row[7]), // No. STT
          };
        } catch (error) {
          console.error(`Error processing invoice row ${index + 5}:`, error);
          return null;
        }
      })
      .filter(Boolean) // Remove null entries
      .filter(item => item.no_sp && item.no_sp !== ''); // Final validation

    // 3. Upsert data to Supabase
    console.log('💾 Upserting data to Supabase...');    // Upsert shipments
    if (shipmentData.length > 0) {
      console.log(`📋 Sample shipment data:`, shipmentData.slice(0, 2));
      
      const { error: shipmentError } = await supabase
        .from('shipments')
        .upsert(shipmentData, { 
          onConflict: 'no_sp',
          ignoreDuplicates: false 
        });

      if (shipmentError) {
        console.error('Error upserting shipments:', shipmentError);
        console.error('Sample problematic data:', shipmentData.slice(0, 5));
        throw shipmentError;
      }
      
      console.log(`✅ Successfully upserted ${shipmentData.length} shipments`);
    }    // Upsert invoices
    if (invoiceData.length > 0) {
      console.log(`📋 Sample invoice data:`, invoiceData.slice(0, 2));
      
      // Use different strategy: delete all and insert (since we sync full data)
      const { error: deleteError } = await supabase
        .from('invoices')
        .delete()
        .neq('id', 0); // Delete all records
        
      if (deleteError) {
        console.error('Error clearing invoices:', deleteError);
      } else {
        console.log('🗑️ Cleared existing invoice data');
      }
      
      const { error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoiceData);

      if (invoiceError) {
        console.error('Error inserting invoices:', invoiceError);
        console.error('Sample problematic invoice data:', invoiceData.slice(0, 5));
        throw invoiceError;
      }
      
      console.log(`✅ Successfully inserted ${invoiceData.length} invoices`);
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
