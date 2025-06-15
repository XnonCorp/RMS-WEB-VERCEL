-- Create tables for RMS data

-- Drop existing tables if they exist (to fix any type issues)
DROP TABLE IF EXISTS shipment_details CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS shipments CASCADE;

-- 1. Shipments table (data from "2025" sheet) - ALL COLUMNS AS VARCHAR
CREATE TABLE shipments (
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

-- 2. Invoices table (data from "INVOICE" sheet) - ALL COLUMNS AS TEXT
CREATE TABLE invoices (
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
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shipments_no_sp ON shipments(no_sp);
CREATE INDEX IF NOT EXISTS idx_shipments_customer ON shipments(customer);
CREATE INDEX IF NOT EXISTS idx_shipments_pick_up ON shipments(pick_up);
CREATE INDEX IF NOT EXISTS idx_shipments_tujuan ON shipments(tujuan);
CREATE INDEX IF NOT EXISTS idx_invoices_no_sp ON invoices(no_sp);
CREATE INDEX IF NOT EXISTS idx_invoices_no_invoice ON invoices(no_invoice);
CREATE INDEX IF NOT EXISTS idx_invoices_tanggal_invoice ON invoices(tanggal_invoice);

-- 4. Create a view for joined data
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

-- 5. Create triggers to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_shipments_updated_at 
    BEFORE UPDATE ON shipments 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- 6. Enable Row Level Security (RLS)
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- 7. Create policies for public read access
CREATE POLICY "Allow public read access on shipments" ON shipments
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access on invoices" ON invoices
    FOR SELECT USING (true);

-- 8. Grant permissions to anon and authenticated users
GRANT SELECT ON shipments TO anon;
GRANT SELECT ON invoices TO anon;
GRANT SELECT ON shipment_details TO anon;

GRANT SELECT ON shipments TO authenticated;
GRANT SELECT ON invoices TO authenticated;
GRANT SELECT ON shipment_details TO authenticated;
