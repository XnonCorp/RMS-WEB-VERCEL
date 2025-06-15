-- Create tables for RMS data

-- 1. Shipments table (data from "2025" sheet)
CREATE TABLE IF NOT EXISTS shipments (
  id SERIAL PRIMARY KEY,
  pick_up VARCHAR(50),
  no_sj VARCHAR(50),
  no_sp VARCHAR(50) UNIQUE NOT NULL,
  customer VARCHAR(255),
  tujuan VARCHAR(255),
  via VARCHAR(255),
  qty VARCHAR(50),
  berat VARCHAR(50),
  jenis_barang VARCHAR(255),
  dikirim_oleh VARCHAR(255),
  armada VARCHAR(255),
  ops VARCHAR(255),
  data_armada VARCHAR(255),
  berangkat VARCHAR(50),
  eta VARCHAR(50),
  diterima VARCHAR(50),
  penerima VARCHAR(255),
  qc VARCHAR(255),
  waktu_diterima VARCHAR(100),
  no_smu_bl VARCHAR(255),
  no_flight_countr VARCHAR(255),
  do_balik VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Invoices table (data from "INVOICE" sheet)
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  no_invoice VARCHAR(50),
  tanggal_invoice VARCHAR(50),
  nama_customer VARCHAR(255),
  tujuan VARCHAR(255),
  no_sp VARCHAR(50) NOT NULL,
  tanggal_pick_up VARCHAR(50),
  keterangan TEXT,
  no_stt VARCHAR(50),
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
