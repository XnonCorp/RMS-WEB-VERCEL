-- Complete RMS Database Schema with Optimization
-- Run this in Supabase Dashboard → SQL Editor

-- ================================================
-- 1. CREATE MAIN TABLES (If not exists)
-- ================================================

-- Drop existing views and tables in correct order (if recreating)
-- DROP VIEW IF EXISTS shipment_details CASCADE;
-- DROP TABLE IF EXISTS invoices CASCADE;
-- DROP TABLE IF EXISTS shipments CASCADE;

-- Shipments table (data from "2025" sheet)
CREATE TABLE IF NOT EXISTS shipments (
  id BIGSERIAL PRIMARY KEY,
  pick_up TEXT,
  no_sj TEXT,
  no_sp TEXT UNIQUE NOT NULL,
  customer TEXT,
  tujuan TEXT,
  via TEXT,
  qty TEXT,
  berat TEXT,
  jenis_barang TEXT,
  dikirim_oleh TEXT,
  armada TEXT,
  ops TEXT,
  data_armada TEXT,
  berangkat TEXT,
  eta TEXT,
  diterima TEXT,
  penerima TEXT,
  qc TEXT,
  waktu_diterima TEXT,
  no_smu_bl TEXT,
  no_flight_countr TEXT,
  do_balik TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Invoices table (data from "INVOICE" sheet)
CREATE TABLE IF NOT EXISTS invoices (
  id BIGSERIAL PRIMARY KEY,
  no_invoice TEXT,
  tanggal_invoice TEXT,
  nama_customer TEXT,
  tujuan TEXT,
  no_sp TEXT NOT NULL,
  tanggal_pick_up TEXT,
  keterangan TEXT,
  no_stt TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(no_sp, no_invoice)
);

-- ================================================
-- 2. ADD OPTIMIZATION COLUMNS
-- ================================================

-- Add row_hash columns for change detection
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS row_hash VARCHAR(32);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS row_hash VARCHAR(32);

-- ================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ================================================

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_shipments_no_sp ON shipments(no_sp);
CREATE INDEX IF NOT EXISTS idx_shipments_customer ON shipments(customer);
CREATE INDEX IF NOT EXISTS idx_shipments_pick_up ON shipments(pick_up);
CREATE INDEX IF NOT EXISTS idx_shipments_tujuan ON shipments(tujuan);
CREATE INDEX IF NOT EXISTS idx_invoices_no_sp ON invoices(no_sp);
CREATE INDEX IF NOT EXISTS idx_invoices_no_invoice ON invoices(no_invoice);
CREATE INDEX IF NOT EXISTS idx_invoices_tanggal_invoice ON invoices(tanggal_invoice);

-- Optimization indexes
CREATE INDEX IF NOT EXISTS idx_shipments_row_hash ON shipments(row_hash);
CREATE INDEX IF NOT EXISTS idx_invoices_row_hash ON invoices(row_hash);
CREATE INDEX IF NOT EXISTS idx_shipments_updated_at ON shipments(updated_at);
CREATE INDEX IF NOT EXISTS idx_invoices_updated_at ON invoices(updated_at);

-- ================================================
-- 4. CREATE JOINED VIEW
-- ================================================

CREATE OR REPLACE VIEW shipment_details AS
SELECT 
  s.id,
  s.pick_up,
  s.no_sj,
  s.no_sp,
  s.customer,
  s.tujuan,
  s.via,
  s.qty,
  s.berat,
  s.jenis_barang,
  s.dikirim_oleh,
  s.armada,
  s.ops,
  s.data_armada,
  s.berangkat,
  s.eta,
  s.diterima,
  s.penerima,
  s.qc,
  s.waktu_diterima,
  s.no_smu_bl,
  s.no_flight_countr,
  s.do_balik,
  i.no_invoice,
  i.tanggal_invoice,
  i.nama_customer AS invoice_customer,
  i.tanggal_pick_up AS invoice_pick_up,
  i.keterangan,
  i.no_stt,
  s.created_at,
  s.updated_at
FROM shipments s
LEFT JOIN invoices i ON s.no_sp = i.no_sp;

-- ================================================
-- 5. CREATE HASH GENERATION FUNCTION
-- ================================================

CREATE OR REPLACE FUNCTION auto_update_hash()
RETURNS TRIGGER AS $$
DECLARE
  row_data JSONB;
BEGIN
  -- Generate hash from row data (exclude id, timestamps, and hash itself)
  row_data := to_jsonb(NEW) - 'id' - 'created_at' - 'updated_at' - 'row_hash';
  NEW.row_hash := md5(row_data::text);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 6. CREATE TRIGGERS FOR AUTO-HASH
-- ================================================

-- Drop existing triggers if any
DROP TRIGGER IF EXISTS trigger_shipments_hash_update ON shipments;
DROP TRIGGER IF EXISTS trigger_invoices_hash_update ON invoices;

-- Create triggers for auto-hash generation
CREATE TRIGGER trigger_shipments_hash_update
  BEFORE INSERT OR UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION auto_update_hash();

CREATE TRIGGER trigger_invoices_hash_update
  BEFORE INSERT OR UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION auto_update_hash();

-- ================================================
-- 7. CREATE TIMESTAMP UPDATE FUNCTION & TRIGGERS
-- ================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: The auto_update_hash() already handles updated_at, 
-- but keep this for manual updates without hash changes

-- ================================================
-- 8. ENABLE ROW LEVEL SECURITY
-- ================================================

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
DROP POLICY IF EXISTS "Allow public read access on shipments" ON shipments;
CREATE POLICY "Allow public read access on shipments" ON shipments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on invoices" ON invoices;
CREATE POLICY "Allow public read access on invoices" ON invoices
    FOR SELECT USING (true);

-- ================================================
-- 9. GRANT PERMISSIONS
-- ================================================

GRANT SELECT ON shipments TO anon;
GRANT SELECT ON invoices TO anon;
GRANT SELECT ON shipment_details TO anon;

GRANT SELECT ON shipments TO authenticated;
GRANT SELECT ON invoices TO authenticated;
GRANT SELECT ON shipment_details TO authenticated;

-- ================================================
-- 10. POPULATE EXISTING DATA WITH HASHES
-- ================================================

DO $$
DECLARE
  rec RECORD;
  row_data JSONB;
  hash_value VARCHAR(32);
  shipment_count INTEGER := 0;
  invoice_count INTEGER := 0;
BEGIN
  -- Update existing shipments with hashes
  FOR rec IN SELECT * FROM shipments WHERE row_hash IS NULL LOOP
    row_data := to_jsonb(rec) - 'id' - 'created_at' - 'updated_at' - 'row_hash';
    hash_value := md5(row_data::text);
    UPDATE shipments SET row_hash = hash_value WHERE id = rec.id;
    shipment_count := shipment_count + 1;
  END LOOP;
  
  -- Update existing invoices with hashes
  FOR rec IN SELECT * FROM invoices WHERE row_hash IS NULL LOOP
    row_data := to_jsonb(rec) - 'id' - 'created_at' - 'updated_at' - 'row_hash';
    hash_value := md5(row_data::text);
    UPDATE invoices SET row_hash = hash_value WHERE id = rec.id;
    invoice_count := invoice_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Hash population completed: % shipments, % invoices updated', shipment_count, invoice_count;
END $$;

-- ================================================
-- 🎉 SETUP COMPLETE!
-- ================================================

-- Verify setup
SELECT 
  'shipments' as table_name,
  COUNT(*) as total_records,
  COUNT(row_hash) as records_with_hash
FROM shipments
UNION ALL
SELECT 
  'invoices' as table_name,
  COUNT(*) as total_records,
  COUNT(row_hash) as records_with_hash
FROM invoices;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ RMS Database setup completed successfully!';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '   1. Test connection: npm run test-connection';
  RAISE NOTICE '   2. Run sync: npm run sync';
END $$;
