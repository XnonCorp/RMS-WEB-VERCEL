'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

interface ShipmentDetail {
  id: number
  pick_up: string
  no_sj: string
  no_sp: string
  customer: string
  tujuan: string
  via: string
  qty: string
  berat: string
  jenis_barang: string
  dikirim_oleh: string
  armada: string
  ops: string
  data_armada: string
  berangkat: string
  eta: string
  diterima: string
  penerima: string
  qc: string
  waktu_diterima: string
  no_smu_bl: string
  no_flight_countr: string
  do_balik: string
  no_invoice?: string | null
  tanggal_invoice?: string | null
  invoice_customer?: string | null
  keterangan?: string | null
  no_stt?: string | null
}

interface Stats {
  totalShipments: number
  totalInvoices: number
  totalCustomers: number
  uniqueDestinations: number
}

export default function Dashboard() {  const [data, setData] = useState<ShipmentDetail[]>([])
  const [filteredData, setFilteredData] = useState<ShipmentDetail[]>([])
  const [stats, setStats] = useState<Stats>({
    totalShipments: 0,
    totalInvoices: 0,
    totalCustomers: 0,
    uniqueDestinations: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [customers, setCustomers] = useState<string[]>([])

  // Fetch data from Supabase
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: shipmentDetails, error } = await supabase
        .from('shipment_details')
        .select('*')
        .order('tgl_kirim', { ascending: false })

      if (error) {
        console.error('Error fetching data:', error)
        return
      }      const formattedData = shipmentDetails || []
      setData(formattedData)
      setFilteredData(formattedData)      // Calculate stats
      const uniqueCustomers = Array.from(new Set(formattedData.map(item => item.customer))).filter(Boolean)
      const uniqueDestinations = Array.from(new Set(formattedData.map(item => item.tujuan))).filter(Boolean)
      const totalInvoices = formattedData.filter(item => item.no_invoice).length

      setStats({
        totalShipments: formattedData.length,
        totalInvoices,
        totalCustomers: uniqueCustomers.length,
        uniqueDestinations: uniqueDestinations.length
      })

      setCustomers(uniqueCustomers.sort())
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter data based on selected filters
  useEffect(() => {
    let filtered = [...data]

    // Filter by customer
    if (selectedCustomer) {
      filtered = filtered.filter(item => item.customer === selectedCustomer)
    }    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(item => new Date(item.pick_up) >= new Date(dateFrom))
    }
    if (dateTo) {
      filtered = filtered.filter(item => new Date(item.pick_up) <= new Date(dateTo))
    }    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(item =>
        item.no_sp?.toLowerCase().includes(term) ||
        item.customer?.toLowerCase().includes(term) ||
        item.tujuan?.toLowerCase().includes(term) ||
        item.via?.toLowerCase().includes(term) ||
        item.jenis_barang?.toLowerCase().includes(term) ||
        item.no_invoice?.toLowerCase().includes(term) ||
        item.no_sj?.toLowerCase().includes(term) ||
        item.penerima?.toLowerCase().includes(term)
      )
    }

    setFilteredData(filtered)
  }, [data, selectedCustomer, dateFrom, dateTo, searchTerm])

  const exportToCSV = () => {
    const headers = [
      'Pick Up', 'No SJ', 'No SP', 'Customer', 'Tujuan', 'VIA',
      'QTY', 'Berat', 'Jenis Barang', 'Dikirim Oleh', 'Armada', 'OPS',
      'Data Armada', 'Berangkat', 'ETA', 'Diterima', 'Penerima', 'QC',
      'Waktu Diterima', 'No SMU/BL', 'No Flight/Countr', 'DO Balik',
      'No Invoice', 'Tanggal Invoice', 'Keterangan', 'No STT'
    ]

    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => [
        row.pick_up,
        row.no_sj,
        row.no_sp,
        row.customer,
        row.tujuan,
        row.via,
        row.qty,
        row.berat,
        row.jenis_barang,
        row.dikirim_oleh,
        row.armada,
        row.ops,
        row.data_armada,
        row.berangkat,
        row.eta,
        row.diterima,
        row.penerima,
        row.qc,
        row.waktu_diterima,
        row.no_smu_bl,
        row.no_flight_countr,
        row.do_balik,
        row.no_invoice || '',
        row.tanggal_invoice || '',
        row.keterangan || '',
        row.no_stt || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rms-data-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(value)
  }
  const formatDate = (dateString: string | null): string => {
    if (!dateString || dateString === '' || dateString === '-') return '-'
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString
      
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      })
    } catch {
      return dateString || '-'
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{height: '100vh'}}>
        <div className="text-center">
          <div className="loading-spinner mb-3"></div>
          <p>Loading data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="h2 mb-3">
            <i className="bi bi-speedometer2 me-2"></i>
            RMS Dashboard
          </h1>
          <p className="text-muted">Customer Data Management System</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card stats-card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-primary text-white rounded-circle p-3 me-3">
                  <i className="bi bi-box-seam"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Total Shipments</h6>
                  <h3 className="card-text mb-0">{stats.totalShipments.toLocaleString()}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card stats-card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-success text-white rounded-circle p-3 me-3">
                  <i className="bi bi-receipt"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Total Invoices</h6>
                  <h3 className="card-text mb-0">{stats.totalInvoices.toLocaleString()}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
          <div className="col-md-3 col-sm-6 mb-3">
          <div className="card stats-card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-info text-white rounded-circle p-3 me-3">
                  <i className="bi bi-people"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Total Customers</h6>
                  <h3 className="card-text mb-0">{stats.totalCustomers.toLocaleString()}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card stats-card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-warning text-white rounded-circle p-3 me-3">
                  <i className="bi bi-geo-alt"></i>
                </div>
                <div>
                  <h6 className="card-title text-muted mb-1">Unique Destinations</h6>
                  <h3 className="card-text mb-0">{stats.uniqueDestinations.toLocaleString()}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-3">
            <i className="bi bi-funnel me-2"></i>
            Filters
          </h5>
          
          <div className="row g-3">
            <div className="col-md-3">
              <label htmlFor="customerSelect" className="form-label">Customer</label>
              <select
                id="customerSelect"
                className="form-select"
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
              >
                <option value="">All Customers</option>
                {customers.map(customer => (
                  <option key={customer} value={customer}>{customer}</option>
                ))}
              </select>
            </div>
            
            <div className="col-md-2">
              <label htmlFor="dateFrom" className="form-label">From Date</label>
              <input
                type="date"
                id="dateFrom"
                className="form-control"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            
            <div className="col-md-2">
              <label htmlFor="dateTo" className="form-label">To Date</label>
              <input
                type="date"
                id="dateTo"
                className="form-control"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            
            <div className="col-md-3">
              <label htmlFor="searchTerm" className="form-label">Search</label>
              <input
                type="text"
                id="searchTerm"
                className="form-control"
                placeholder="Search by SP, Customer, City, etc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="col-md-2 d-flex align-items-end">
              <button
                className="btn btn-success export-btn w-100"
                onClick={exportToCSV}
                disabled={filteredData.length === 0}
              >
                <i className="bi bi-download me-2"></i>
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0">
              <i className="bi bi-table me-2"></i>
              Data Overview ({filteredData.length} records)
            </h5>
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={fetchData}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Refresh
            </button>
          </div>
          
          <div className="table-responsive">
            <table className="table table-hover">              <thead className="table-light">
                <tr>
                  <th>No</th>
                  <th>Pick Up</th>
                  <th>Pengiriman</th>
                  <th>No. SP</th>
                  <th>No. SJ</th>
                  <th>Customer</th>
                  <th>Tujuan</th>
                  <th>Qty</th>
                  <th>Tgl. Diterima</th>
                  <th>Penerima</th>
                  <th>Dok. Balik</th>
                  <th>No. Inv</th>
                  <th>Tgl. Inv</th>
                  <th>Keterangan/Status</th>
                </tr>
              </thead>              <tbody>
                {filteredData.map((row, index) => (
                  <tr key={row.id}>
                    <td>{index + 1}</td>
                    <td>{formatDate(row.pick_up)}</td>
                    <td>{row.via}</td>
                    <td><strong>{row.no_sp}</strong></td>
                    <td><code>{row.no_sj}</code></td>
                    <td>{row.customer}</td>
                    <td>{row.tujuan}</td>
                    <td>{row.qty}</td>
                    <td>{formatDate(row.diterima)}</td>
                    <td>{row.penerima || '-'}</td>
                    <td>{row.do_balik || '-'}</td>
                    <td>
                      {row.no_invoice ? (
                        <span className="badge bg-success">{row.no_invoice}</span>
                      ) : (
                        <span className="badge bg-secondary">-</span>
                      )}
                    </td>
                    <td>{formatDate(row.tanggal_invoice || null)}</td>
                    <td>
                      {row.keterangan ? (
                        <span className="text-primary">{row.keterangan}</span>
                      ) : row.diterima ? (
                        <span className="badge bg-success">Diterima</span>
                      ) : row.berangkat ? (
                        <span className="badge bg-warning">In Transit</span>
                      ) : (
                        <span className="badge bg-secondary">Belum Berangkat</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredData.length === 0 && (
              <div className="text-center py-5">
                <i className="bi bi-inbox display-1 text-muted"></i>
                <h5 className="mt-3 text-muted">No data found</h5>
                <p className="text-muted">Try adjusting your filters or refresh the data</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
