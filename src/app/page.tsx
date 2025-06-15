'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

interface ShipmentDetail {
  id: number
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

export default function Dashboard() {
  const [data, setData] = useState<ShipmentDetail[]>([])
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
        .order('pick_up', { ascending: false })

      if (error) {
        console.error('Error fetching data:', error)
        return
      }

      const formattedData = shipmentDetails || []
      setData(formattedData)
      setFilteredData(formattedData)

      // Calculate stats
      const uniqueCustomers = Array.from(new Set(formattedData.map((item: ShipmentDetail) => item.customer))).filter(Boolean)
      const uniqueDestinations = Array.from(new Set(formattedData.map((item: ShipmentDetail) => item.tujuan))).filter(Boolean)
      const totalInvoices = formattedData.filter((item: ShipmentDetail) => item.no_invoice).length

      setStats({
        totalShipments: formattedData.length,
        totalInvoices,
        totalCustomers: uniqueCustomers.length,
        uniqueDestinations: uniqueDestinations.length
      })

      setCustomers(uniqueCustomers.sort() as string[])
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
    }

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(item => item.pick_up && new Date(item.pick_up) >= new Date(dateFrom))
    }
    if (dateTo) {
      filtered = filtered.filter(item => item.pick_up && new Date(item.pick_up) <= new Date(dateTo))
    }

    // Search filter
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
      ...filteredData.map((row: ShipmentDetail) => [
        row.pick_up || '',
        row.no_sj || '',
        row.no_sp || '',
        row.customer || '',
        row.tujuan || '',
        row.via || '',
        row.qty || '',
        row.berat || '',
        row.jenis_barang || '',
        row.dikirim_oleh || '',
        row.armada || '',
        row.ops || '',
        row.data_armada || '',
        row.berangkat || '',
        row.eta || '',
        row.diterima || '',
        row.penerima || '',
        row.qc || '',
        row.waktu_diterima || '',
        row.no_smu_bl || '',
        row.no_flight_countr || '',
        row.do_balik || '',
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
              <div className="w-12 h-12 border-4 border-transparent border-t-blue-400 rounded-full animate-spin absolute top-2 left-1/2 transform -translate-x-1/2"></div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Loading Dashboard...</h3>
              <p className="text-gray-600 dark:text-gray-400">Fetching latest data from Supabase</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center space-x-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20 shadow-lg">
            <div className="w-6 h-6">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              RMS Dashboard
            </span>
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Customer Data Management
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Real-time shipment and invoice tracking with automated Google Sheets synchronization
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Shipments</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalShipments.toLocaleString()}</p>
                  <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Active
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white group-hover:scale-110 transition-transform duration-300">
                  <div className="w-6 h-6">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Invoices</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalInvoices.toLocaleString()}</p>
                  <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Processed
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl text-white group-hover:scale-110 transition-transform duration-300">
                  <div className="w-6 h-6">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Customers</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalCustomers.toLocaleString()}</p>
                  <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Registered
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white group-hover:scale-110 transition-transform duration-300">
                  <div className="w-6 h-6">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Destinations</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.uniqueDestinations.toLocaleString()}</p>
                  <div className="flex items-center text-xs text-orange-600 dark:text-orange-400">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                    Locations
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white group-hover:scale-110 transition-transform duration-300">
                  <div className="w-6 h-6">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg">
          <div className="p-6 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg text-white">
                <div className="w-5 h-5">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Filters & Search</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Global Search</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search all data..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <div className="w-5 h-5">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                >
                  <option value="">All Customers</option>
                  {customers.map(customer => (
                    <option key={customer} value={customer}>{customer}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                />
              </div>
              
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Actions</label>
                <div className="flex space-x-2">
                  <button
                    onClick={exportToCSV}
                    disabled={filteredData.length === 0}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 font-medium disabled:cursor-not-allowed"
                  >
                    <div className="w-5 h-5">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </div>
                    <span>Export</span>
                  </button>
                  <button
                    onClick={fetchData}
                    className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200"
                  >
                    <div className="w-5 h-5">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg text-white">
                  <div className="w-5 h-5">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Data Overview</h2>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  {filteredData.length} records
                </span>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">No</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Pick Up</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Pengiriman</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">No. SP</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">No. SJ</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Tujuan</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Qty</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Tgl. Diterima</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Penerima</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Dok. Balik</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">No. Inv</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Tgl. Inv</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {filteredData.map((row, index) => (
                  <tr key={row.id} className="hover:bg-white/30 dark:hover:bg-gray-700/30 transition-colors duration-200">
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{formatDate(row.pick_up)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{row.via || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="font-mono font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                        {row.no_sp}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="font-mono text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                        {row.no_sj || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{row.customer || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{row.tujuan || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{row.qty || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{formatDate(row.diterima)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{row.penerima || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{row.do_balik || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      {row.no_invoice ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          {row.no_invoice}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          -
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{formatDate(row.tanggal_invoice)}</td>
                    <td className="px-6 py-4 text-sm">
                      {row.keterangan ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {row.keterangan}
                        </span>
                      ) : row.diterima ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          Diterima
                        </span>
                      ) : row.berangkat ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                          In Transit
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          Belum Berangkat
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredData.length === 0 && (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <div className="w-12 h-12 text-gray-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No data found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Try adjusting your filters or refresh the data</p>
                <button
                  onClick={fetchData}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 font-medium"
                >
                  <div className="w-5 h-5">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <span>Refresh Data</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
