const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Utility functions
function cleanString(value) {
  if (!value || value === '' || value === '-') return null;
  const cleaned = value.toString().trim();
  if (cleaned === 'undefined' || cleaned === 'null') return null;
  return cleaned;
}

function generateRowHash(rowData) {
  const dataString = JSON.stringify(rowData);
  return crypto.createHash('md5').update(dataString).digest('hex');
}

// === ORIGINAL SYNC METHOD (Fallback) ===
async function originalSync() {
  console.log('🐌 Running original sync method (full sync)...');
  
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId2025 = process.env.GOOGLE_SHEETS_ID_2025;
    const spreadsheetIdInvoice = process.env.GOOGLE_SHEETS_ID_INVOICE;

    // Get shipments data
    const shipmentsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId2025,
      range: '2025!A3:W',
    });

    const shipmentRows = shipmentsResponse.data.values || [];
    const shipmentData = shipmentRows
      .filter(row => row[3] && row[3] !== '')
      .map(row => ({
        pick_up: cleanString(row[1]),
        no_sj: cleanString(row[2]),
        no_sp: cleanString(row[3]),
        customer: cleanString(row[4]),
        tujuan: cleanString(row[5]),
        via: cleanString(row[6]),
        qty: cleanString(row[7]),
        berat: cleanString(row[8]),
        jenis_barang: cleanString(row[9]),
        dikirim_oleh: cleanString(row[10]),
        armada: cleanString(row[11]),
        ops: cleanString(row[12]),
        data_armada: cleanString(row[13]),
        berangkat: cleanString(row[14]),
        eta: cleanString(row[15]),
        diterima: cleanString(row[16]),
        penerima: cleanString(row[17]),
        qc: cleanString(row[18]),
        waktu_diterima: cleanString(row[19]),
        no_smu_bl: cleanString(row[20]),
        no_flight_countr: cleanString(row[21]),
        do_balik: cleanString(row[22])
      }))
      .filter(Boolean);

    // Get invoices data
    const invoicesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdInvoice,
      range: 'INVOICE!B5:I',
    });

    const invoiceRows = invoicesResponse.data.values || [];
    const invoiceData = invoiceRows
      .filter(row => row[4] && row[4] !== '')
      .map(row => ({
        no_invoice: cleanString(row[0]),
        tanggal_invoice: cleanString(row[1]),
        nama_customer: cleanString(row[2]),
        tujuan: cleanString(row[3]),
        no_sp: cleanString(row[4]),
        tanggal_pick_up: cleanString(row[5]),
        keterangan: cleanString(row[6]),
        no_stt: cleanString(row[7])
      }))
      .filter(Boolean);

    // Upsert shipments
    if (shipmentData.length > 0) {
      const { error } = await supabase
        .from('shipments')
        .upsert(shipmentData, { onConflict: 'no_sp' });
      
      if (error) throw error;
    }

    // Clear and insert invoices
    if (invoiceData.length > 0) {
      await supabase.from('invoices').delete().neq('id', 0);
      const { error } = await supabase.from('invoices').insert(invoiceData);
      if (error) throw error;
    }

    return {
      method: 'original',
      shipmentsProcessed: shipmentData.length,
      invoicesProcessed: invoiceData.length
    };

  } catch (error) {
    console.error('❌ Original sync failed:', error);
    throw error;
  }
}

// === OPTIMIZED SYNC METHOD (Fast) ===
async function optimizedSync() {
  console.log('⚡ Running optimized sync (incremental)...');
  
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId2025 = process.env.GOOGLE_SHEETS_ID_2025;
    const spreadsheetIdInvoice = process.env.GOOGLE_SHEETS_ID_INVOICE;

    // === SHIPMENTS PROCESSING ===
    const shipmentsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId2025,
      range: '2025!A3:W',
    });

    const shipmentRows = shipmentsResponse.data.values || [];
    
    // Get existing shipments with hashes
    const { data: existingShipments } = await supabase
      .from('shipments')
      .select('no_sp, row_hash, id');

    const existingShipmentsMap = new Map(
      existingShipments?.map(s => [s.no_sp, { hash: s.row_hash, id: s.id }]) || []
    );

    let shipmentsToInsert = [];
    let shipmentsToUpdate = [];
    const processedNoSPs = new Set();

    // Process shipments
    for (const row of shipmentRows) {
      if (!row[3] || row[3] === '') continue;
      
      const shipmentObj = {
        pick_up: cleanString(row[1]),
        no_sj: cleanString(row[2]),
        no_sp: cleanString(row[3]),
        customer: cleanString(row[4]),
        tujuan: cleanString(row[5]),
        via: cleanString(row[6]),
        qty: cleanString(row[7]),
        berat: cleanString(row[8]),
        jenis_barang: cleanString(row[9]),
        dikirim_oleh: cleanString(row[10]),
        armada: cleanString(row[11]),
        ops: cleanString(row[12]),
        data_armada: cleanString(row[13]),
        berangkat: cleanString(row[14]),
        eta: cleanString(row[15]),
        diterima: cleanString(row[16]),
        penerima: cleanString(row[17]),
        qc: cleanString(row[18]),
        waktu_diterima: cleanString(row[19]),
        no_smu_bl: cleanString(row[20]),
        no_flight_countr: cleanString(row[21]),
        do_balik: cleanString(row[22])
      };

      const newHash = generateRowHash(shipmentObj);
      shipmentObj.row_hash = newHash;
      
      processedNoSPs.add(shipmentObj.no_sp);
      const existing = existingShipmentsMap.get(shipmentObj.no_sp);
      
      if (!existing) {
        shipmentsToInsert.push(shipmentObj);
      } else if (existing.hash !== newHash) {
        shipmentObj.id = existing.id;
        shipmentsToUpdate.push(shipmentObj);
      }
    }

    // Find deleted shipments
    const deletedShipments = Array.from(existingShipmentsMap.keys())
      .filter(noSp => !processedNoSPs.has(noSp));

    // Execute shipment operations
    let shipmentStats = { added: 0, updated: 0, deleted: 0 };

    if (shipmentsToInsert.length > 0) {
      const { error } = await supabase.from('shipments').insert(shipmentsToInsert);
      if (error) throw error;
      shipmentStats.added = shipmentsToInsert.length;
    }

    if (shipmentsToUpdate.length > 0) {
      for (const shipment of shipmentsToUpdate) {
        const { error } = await supabase
          .from('shipments')
          .update(shipment)
          .eq('id', shipment.id);
        if (!error) shipmentStats.updated++;
      }
    }

    if (deletedShipments.length > 0) {
      const { error } = await supabase
        .from('shipments')
        .delete()
        .in('no_sp', deletedShipments);
      if (!error) shipmentStats.deleted = deletedShipments.length;
    }

    // === INVOICES PROCESSING ===
    const invoicesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetIdInvoice,
      range: 'INVOICE!B5:I',
    });

    const invoiceRows = invoicesResponse.data.values || [];
    
    // Get existing invoices with hashes
    const { data: existingInvoices } = await supabase
      .from('invoices')
      .select('no_sp, no_invoice, row_hash, id');

    const existingInvoicesMap = new Map(
      existingInvoices?.map(i => [`${i.no_sp}_${i.no_invoice}`, { hash: i.row_hash, id: i.id }]) || []
    );

    let invoicesToInsert = [];
    let invoicesToUpdate = [];
    const processedInvoiceKeys = new Set();

    // Process invoices
    for (const row of invoiceRows) {
      if (!row[4] || row[4] === '') continue;
      
      const invoiceObj = {
        no_invoice: cleanString(row[0]),
        tanggal_invoice: cleanString(row[1]),
        nama_customer: cleanString(row[2]),
        tujuan: cleanString(row[3]),
        no_sp: cleanString(row[4]),
        tanggal_pick_up: cleanString(row[5]),
        keterangan: cleanString(row[6]),
        no_stt: cleanString(row[7])
      };

      const newHash = generateRowHash(invoiceObj);
      invoiceObj.row_hash = newHash;
      
      const key = `${invoiceObj.no_sp}_${invoiceObj.no_invoice}`;
      processedInvoiceKeys.add(key);
      const existing = existingInvoicesMap.get(key);
      
      if (!existing) {
        invoicesToInsert.push(invoiceObj);
      } else if (existing.hash !== newHash) {
        invoiceObj.id = existing.id;
        invoicesToUpdate.push(invoiceObj);
      }
    }

    // Find deleted invoices
    const deletedInvoices = Array.from(existingInvoicesMap.keys())
      .filter(key => !processedInvoiceKeys.has(key))
      .map(key => existingInvoicesMap.get(key).id);

    // Execute invoice operations
    let invoiceStats = { added: 0, updated: 0, deleted: 0 };

    if (invoicesToInsert.length > 0) {
      const { error } = await supabase.from('invoices').insert(invoicesToInsert);
      if (error) throw error;
      invoiceStats.added = invoicesToInsert.length;
    }

    if (invoicesToUpdate.length > 0) {
      for (const invoice of invoicesToUpdate) {
        const { error } = await supabase
          .from('invoices')
          .update(invoice)
          .eq('id', invoice.id);
        if (!error) invoiceStats.updated++;
      }
    }

    if (deletedInvoices.length > 0) {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .in('id', deletedInvoices);
      if (!error) invoiceStats.deleted = deletedInvoices.length;
    }

    return {
      method: 'optimized',
      shipments: shipmentStats,
      invoices: invoiceStats
    };

  } catch (error) {
    console.error('❌ Optimized sync failed:', error);
    throw error;
  }
}

// === SMART SYNC (Check Changes First) ===
async function smartSync() {
  console.log('🧠 Starting smart sync...');
  
  try {
    // Quick check for changes (sample first 50 records)
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId2025 = process.env.GOOGLE_SHEETS_ID_2025;
    const spreadsheetIdInvoice = process.env.GOOGLE_SHEETS_ID_INVOICE;

    // Check recent shipments for changes
    const { data: recentShipments } = await supabase
      .from('shipments')
      .select('no_sp, row_hash')
      .order('updated_at', { ascending: false })
      .limit(50);

    const recentShipmentsMap = new Map(
      recentShipments?.map(s => [s.no_sp, s.row_hash]) || []
    );

    const shipmentsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId2025,
      range: '2025!A3:W50',
    });

    const shipmentRows = shipmentsResponse.data.values || [];
    let hasChanges = false;

    // Quick check for shipment changes
    for (const row of shipmentRows) {
      if (!row[3] || row[3] === '') continue;
      
      const shipmentObj = {
        no_sp: cleanString(row[3]),
        customer: cleanString(row[4]),
        pick_up: cleanString(row[1]),
        no_sj: cleanString(row[2])
      };
      
      const currentHash = generateRowHash(shipmentObj);
      const existingHash = recentShipmentsMap.get(shipmentObj.no_sp);
      
      if (!existingHash || existingHash !== currentHash) {
        hasChanges = true;
        break;
      }
    }

    // Check recent invoices if no shipment changes
    if (!hasChanges) {
      const { data: recentInvoices } = await supabase
        .from('invoices')
        .select('no_sp, no_invoice, row_hash')
        .order('updated_at', { ascending: false })
        .limit(50);

      const recentInvoicesMap = new Map(
        recentInvoices?.map(i => [`${i.no_sp}_${i.no_invoice}`, i.row_hash]) || []
      );

      const invoicesResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetIdInvoice,
        range: 'INVOICE!B5:I50',
      });

      const invoiceRows = invoicesResponse.data.values || [];

      for (const row of invoiceRows) {
        if (!row[4] || row[4] === '') continue;
        
        const invoiceObj = {
          no_invoice: cleanString(row[0]),
          no_sp: cleanString(row[4]),
          tanggal_invoice: cleanString(row[1])
        };
        
        const currentHash = generateRowHash(invoiceObj);
        const key = `${invoiceObj.no_sp}_${invoiceObj.no_invoice}`;
        const existingHash = recentInvoicesMap.get(key);
        
        if (!existingHash || existingHash !== currentHash) {
          hasChanges = true;
          break;
        }
      }
    }

    if (!hasChanges) {
      console.log('✅ No changes detected, skipping sync');
      return {
        method: 'smart',
        skipped: true,
        message: 'No changes detected'
      };
    }

    console.log('🔄 Changes detected, running optimized sync...');
    return await optimizedSync();

  } catch (error) {
    console.error('❌ Smart sync failed:', error);
    throw error;
  }
}

// === MAIN FUNCTION ===
async function runSync() {
  const startTime = Date.now();
  const method = process.argv[2] || 'smart';
  
  console.log(`🚀 Starting sync with method: ${method}`);
  
  try {
    let result;
    
    switch (method) {
      case 'original':
        result = await originalSync();
        break;
      case 'optimized':
        result = await optimizedSync();
        break;
      case 'smart':
      default:
        result = await smartSync();
        break;
    }
    
    const duration = Date.now() - startTime;
    console.log(`🎉 Sync completed in ${duration}ms`);
    console.log('Result:', result);
    
    return result;
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  }
}

// CLI usage
if (require.main === module) {
  runSync()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runSync, smartSync, optimizedSync, originalSync };
