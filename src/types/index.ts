export interface ShipmentData {
  id?: number
  pick_up: string | null
  no_sj: string | null
  no_sp: string
  customer: string | null
  tujuan: string | null
  via: string | null
  qty: string | null
  berat: string | null
  jenis_barang: string | null
  dikirim_oleh: string | null
  armada: string | null
  ops: string | null
  data_armada: string | null
  berangkat: string | null
  eta: string | null
  diterima: string | null
  penerima: string | null
  qc: string | null
  waktu_diterima: string | null
  no_smu_bl: string | null
  no_flight_countr: string | null
  do_balik: string | null
  created_at?: string
  updated_at?: string
}

export interface InvoiceData {
  id?: number
  no_invoice: string | null
  tanggal_invoice: string | null
  nama_customer: string | null
  tujuan: string | null
  no_sp: string
  tanggal_pick_up: string | null
  keterangan: string | null
  no_stt: string | null
  created_at?: string
  updated_at?: string
}

export interface ShipmentDetail extends ShipmentData {
  no_invoice?: string | null
  tanggal_invoice?: string | null
  invoice_customer?: string | null
  invoice_pick_up?: string | null
  keterangan?: string | null
  no_stt?: string | null
}

export interface DashboardStats {
  totalShipments: number
  totalInvoices: number
  totalCustomers: number
  uniqueDestinations: number
  lastSyncTime?: string
}

export interface SyncResult {
  success: boolean
  shipmentsProcessed: number
  invoicesProcessed: number
  totalShipments: number
  totalInvoices: number
  timestamp: string
  errors?: string[]
}
