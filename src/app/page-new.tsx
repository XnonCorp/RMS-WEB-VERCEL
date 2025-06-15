'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Package, 
  FileText, 
  Users, 
  MapPin,
  Calendar,
  ChevronRight,
  TrendingUp
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

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
  no_invoice?: string
  tanggal_invoice?: string
  invoice_customer?: string
  keterangan?: string
  no_stt?: string
}

interface Stats {
  totalShipments: number
  totalInvoices: number
  totalCustomers: number
  uniqueDestinations: number
}

const StatCard = ({ icon: Icon, title, value, trend, color }: {
  icon: any
  title: string
  value: string | number
  trend?: string
  color: string
}) => (
  <div className={cn("p-6 rounded-xl border card-hover", color)}>
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        {trend && (
          <div className="flex items-center text-xs text-green-600">
            <TrendingUp className="w-3 h-3 mr-1" />
            {trend}
          </div>
        )}
      </div>
      <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
)

const Badge = ({ children, variant = 'default' }: { 
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'secondary' 
}) => {
  const variants = {
    default: 'bg-primary text-primary-foreground',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }
  
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", variants[variant])}>
      {children}
    </span>
  )
}

export default function Dashboard() {
  const [data, setData] = useState<ShipmentDetail[]>([])
  const [filteredData, setFilteredData] = useState<ShipmentDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [customers, setCustomers] = useState<string[]>([])
  const [stats, setStats] = useState<Stats>({
    totalShipments: 0,
    totalInvoices: 0,
    totalCustomers: 0,
    uniqueDestinations: 0
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const { data: shipmentData, error } = await supabase
        .from('shipment_details')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching data:', error)
        return
      }

      const processedData = shipmentData || []
      setData(processedData)
      setFilteredData(processedData)

      // Calculate stats
      const uniqueCustomers = new Set(processedData.map(item => item.customer).filter(Boolean))
      const uniqueDestinations = new Set(processedData.map(item => item.tujuan).filter(Boolean))
      const invoiceCount = processedData.filter(item => item.no_invoice).length

      setStats({
        totalShipments: processedData.length,
        totalInvoices: invoiceCount,
        totalCustomers: uniqueCustomers.size,
        uniqueDestinations: uniqueDestinations.size
      })

      // Set customers for filter
      setCustomers(Array.from(uniqueCustomers).sort())

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    let filtered = data

    if (searchTerm) {
      filtered = filtered.filter(item =>
        Object.values(item).some(value =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    if (selectedCustomer) {
      filtered = filtered.filter(item => item.customer === selectedCustomer)
    }

    setFilteredData(filtered)
  }, [data, searchTerm, selectedCustomer])

  const exportToCSV = () => {
    const csvData = filteredData.map((row, index) => ({
      'No': index + 1,
      'Pick Up': formatDate(row.pick_up),
      'Pengiriman': row.via || '-',
      'No. SP': row.no_sp,
      'No. SJ': row.no_sj || '-',
      'Customer': row.customer || '-',
      'Tujuan': row.tujuan || '-',
      'Qty': row.qty || '-',
      'Tgl. Diterima': formatDate(row.diterima),
      'Penerima': row.penerima || '-',
      'Dok. Balik': row.do_balik || '-',
      'No. Inv': row.no_invoice || '-',
      'Tgl. Inv': formatDate(row.tanggal_invoice),
      'Keterangan/Status': row.keterangan || (row.diterima ? 'Diterima' : row.berangkat ? 'In Transit' : 'Belum Berangkat')
    }))

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `rms-data-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Loading Dashboard...</h3>
              <p className="text-muted-foreground">Fetching latest data</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-4 py-2 border">
            <Package className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">RMS Dashboard</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Customer Data Management
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time shipment and invoice tracking with automated Google Sheets synchronization
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Package}
            title="Total Shipments"
            value={stats.totalShipments}
            trend="+12% from last month"
            color="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
          />
          <StatCard
            icon={FileText}
            title="Total Invoices"
            value={stats.totalInvoices}
            trend="+8% from last month"
            color="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
          />
          <StatCard
            icon={Users}
            title="Active Customers"
            value={stats.totalCustomers}
            trend="+3 new this month"
            color="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
          />
          <StatCard
            icon={MapPin}
            title="Destinations"
            value={stats.uniqueDestinations}
            trend="+5 new locations"
            color="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
          />
        </div>

        {/* Filters */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border p-6 space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Filters & Search</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Global Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search all data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white/50 dark:bg-gray-900/50 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Customer</label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white/50 dark:bg-gray-900/50 focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Customers</option>
                {customers.map(customer => (
                  <option key={customer} value={customer}>{customer}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end space-x-2">
              <button
                onClick={exportToCSV}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={fetchData}
                className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Data Overview</h2>
                <Badge variant="secondary">{filteredData.length} records</Badge>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Pick Up</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Pengiriman</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">No. SP</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">No. SJ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tujuan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tgl. Diterima</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Penerima</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Dok. Balik</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">No. Inv</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tgl. Inv</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Keterangan/Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredData.map((row, index) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-muted-foreground">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium">{formatDate(row.pick_up)}</td>
                    <td className="px-4 py-3 text-sm">{row.via || '-'}</td>
                    <td className="px-4 py-3 text-sm font-mono font-semibold text-primary">{row.no_sp}</td>
                    <td className="px-4 py-3 text-sm font-mono">{row.no_sj || '-'}</td>
                    <td className="px-4 py-3 text-sm font-medium">{row.customer || '-'}</td>
                    <td className="px-4 py-3 text-sm">{row.tujuan || '-'}</td>
                    <td className="px-4 py-3 text-sm">{row.qty || '-'}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(row.diterima)}</td>
                    <td className="px-4 py-3 text-sm">{row.penerima || '-'}</td>
                    <td className="px-4 py-3 text-sm">{row.do_balik || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      {row.no_invoice ? (
                        <Badge variant="success">{row.no_invoice}</Badge>
                      ) : (
                        <Badge variant="secondary">-</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">{formatDate(row.tanggal_invoice)}</td>
                    <td className="px-4 py-3 text-sm">
                      {row.keterangan ? (
                        <span className="text-primary font-medium">{row.keterangan}</span>
                      ) : row.diterima ? (
                        <Badge variant="success">Diterima</Badge>
                      ) : row.berangkat ? (
                        <Badge variant="warning">In Transit</Badge>
                      ) : (
                        <Badge variant="secondary">Belum Berangkat</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredData.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No data found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or refresh the data</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
