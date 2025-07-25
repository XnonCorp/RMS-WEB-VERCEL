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
    totalShipments: 0,    totalInvoices: 0,
    totalCustomers: 0,
    uniqueDestinations: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [customers, setCustomers] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // Load saved customer selection from localStorage on component mount
  useEffect(() => {
    const savedCustomers = localStorage.getItem('rms-selected-customers')
    if (savedCustomers) {
      try {
        const parsed = JSON.parse(savedCustomers)
        if (Array.isArray(parsed)) {
          setSelectedCustomers(parsed)
        }
      } catch (error) {
        console.error('Error parsing saved customers:', error)
      }
    }
  }, [])

  // Save customer selection to localStorage whenever it changes
  useEffect(() => {
    if (selectedCustomers.length > 0) {
      localStorage.setItem('rms-selected-customers', JSON.stringify(selectedCustomers))
    } else {
      localStorage.removeItem('rms-selected-customers')
    }
  }, [selectedCustomers])
  // Fetch data from Supabase
  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch all data by removing limit and using pagination
      let allData: ShipmentDetail[] = []
      let from = 0
      const batchSize = 1000
      let hasMore = true

      while (hasMore) {        const { data: shipmentDetails, error } = await supabase
          .from('shipment_details')
          .select('*')
          .order('id', { ascending: false })
          .range(from, from + batchSize - 1)

        if (error) {
          console.error('Error fetching data:', error)
          break
        }

        if (shipmentDetails && shipmentDetails.length > 0) {
          allData = [...allData, ...shipmentDetails]
          from += batchSize
          
          // If we got less than batchSize, we've reached the end
          if (shipmentDetails.length < batchSize) {
            hasMore = false
          }
        } else {
          hasMore = false
        }
      }      console.log(`Fetched ${allData.length} total records`)      
      // Sort by ID ascending for consistent ordering (oldest first, but stable)
      allData.sort((a, b) => {
        const idA = a.id || 0
        const idB = b.id || 0
        if (idA !== idB) return idA - idB
        // Secondary sort by no_sp for stability
        return (a.no_sp || '').localeCompare(b.no_sp || '')
      })
      
      setData(allData)
      setFilteredData(allData)      // Calculate stats - only use customer field, not invoice_customer
      const normalizeCustomerName = (name: string | null): string => {
        if (!name) return ''
        return name.trim().toLowerCase().replace(/\s+/g, ' ')
      }
      
      // Collect all unique customers ONLY from customer field
      const customerSet = new Set<string>()
      const customerMap = new Map<string, string>()
      
      allData.forEach(item => {
        if (item.customer && item.customer.trim()) {
          const trimmed = item.customer.trim()
          const normalized = normalizeCustomerName(trimmed)
          
          if (!customerMap.has(normalized)) {
            customerMap.set(normalized, trimmed)
            customerSet.add(trimmed)
          }
        }
      })
      
      const uniqueCustomers = Array.from(customerSet).sort()
      const uniqueDestinations = Array.from(new Set(allData.map((item: ShipmentDetail) => item.tujuan))).filter(Boolean)
      const totalInvoices = allData.filter((item: ShipmentDetail) => item.no_invoice).length

      setStats({
        totalShipments: allData.length,
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

  useEffect(() => {
    fetchData()
  }, [])
  // Helper function to normalize customer names
  const normalizeCustomerName = (name: string | null): string => {
    if (!name) return ''
    return name.trim().toLowerCase().replace(/\s+/g, ' ')
  }

  // Filter data based on selected filters
  useEffect(() => {
    let filtered = [...data]

    // Filter by multiple customers
    if (selectedCustomers.length > 0) {
      filtered = filtered.filter(item => {
        if (!item.customer) return false
        const normalizedItemCustomer = normalizeCustomerName(item.customer)
        return selectedCustomers.some((selectedCustomer: string) => 
          normalizeCustomerName(selectedCustomer) === normalizedItemCustomer
        )
      })
    }

    // Filter by pickup date range
    if (dateFrom) {
      filtered = filtered.filter(item => item.pick_up && new Date(item.pick_up) >= new Date(dateFrom))
    }
    if (dateTo) {
      filtered = filtered.filter(item => item.pick_up && new Date(item.pick_up) <= new Date(dateTo))
    }// Search filter with multiple terms support
    if (searchTerm) {
      // Split search terms by separator (comma, semicolon, or pipe)
      const searchTerms = searchTerm
        .split(/[,;|]/)
        .map((term: string) => term.trim().toLowerCase())
        .filter((term: string) => term.length > 0)
      
      if (searchTerms.length > 0) {
        filtered = filtered.filter(item => {
          // Check if ANY of the search terms matches ANY of the searchable fields
          return searchTerms.some((term: string) => 
            item.no_sp?.toLowerCase().includes(term) ||
            item.customer?.toLowerCase().includes(term) ||
            item.tujuan?.toLowerCase().includes(term) ||
            item.berangkat?.toLowerCase().includes(term) ||
            item.jenis_barang?.toLowerCase().includes(term) ||
            item.no_invoice?.toLowerCase().includes(term) ||
            item.no_sj?.toLowerCase().includes(term) ||
            item.penerima?.toLowerCase().includes(term) ||
            item.via?.toLowerCase().includes(term) ||
            item.armada?.toLowerCase().includes(term) ||
            item.ops?.toLowerCase().includes(term) ||
            item.qc?.toLowerCase().includes(term) ||
            item.no_smu_bl?.toLowerCase().includes(term) ||
            item.no_flight_countr?.toLowerCase().includes(term) ||
            item.do_balik?.toLowerCase().includes(term) ||
            item.no_stt?.toLowerCase().includes(term)
          )
        })
      }
    }

    setFilteredData(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [data, selectedCustomers, dateFrom, dateTo, searchTerm])

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = filteredData.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const exportToCSV = () => {
    const headers = [
      'Pick Up', 'No SJ', 'No SP', 'Customer', 'Tujuan', 'VIA',
      'QTY', 'Berat', 'Jenis Barang', 'Dikirim Oleh', 'Armada', 'OPS',
      'Data Armada', 'Berangkat', 'ETA', 'Diterima', 'Penerima', 'QC',      'Waktu Diterima', 'No SMU/BL', 'No Flight/Countr', 'DO Balik',
      'No Invoice', 'Tanggal Invoice', 'No STT'
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
        row.no_flight_countr || '',        row.do_balik || '',
        row.no_invoice || '',        row.tanggal_invoice || '',
        row.no_stt || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    // Format filename date as "14-Jun-24" for better readability
    const now = new Date()
    const day = now.getDate().toString().padStart(2, '0')
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = monthNames[now.getMonth()]
    const year = now.getFullYear().toString().slice(-2)
    a.download = `rms-data-${day}-${month}-${year}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString || dateString === '' || dateString === '-') return '-'
    
    try {
      let date: Date
      
      // Handle different date formats
      if (dateString.includes('/')) {
        // Handle DD/MM/YY or DD/MM/YYYY formats
        const parts = dateString.split('/')
        if (parts.length === 3) {
          const day = parseInt(parts[0])
          const month = parseInt(parts[1]) - 1 // Month is 0-indexed
          let year = parseInt(parts[2])
          
          // Convert 2-digit year to 4-digit year
          if (year < 100) {
            year = year < 50 ? 2000 + year : 1900 + year
          }
          
          date = new Date(year, month, day)
        } else {
          date = new Date(dateString)
        }
      } else {
        date = new Date(dateString)
      }
      
      if (isNaN(date.getTime())) return dateString
      
      // Format: "14 Jun 24"
      const day = date.getDate().toString().padStart(2, '0')
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const month = monthNames[date.getMonth()]
      const year = date.getFullYear().toString().slice(-2) // Last 2 digits of year
      
      return `${day} ${month} ${year}`
    } catch {
      return dateString || '-'
    }
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto"></div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Loading Dashboard</h3>
              <p className="text-gray-600 dark:text-gray-400">Fetching latest data from databases...</p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-500">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span>This may take a moment for large datasets</span>
              </div>
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
            </span>          </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Global Search</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search multiple terms: customer1, SP123; tujuan | armada"
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
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Use <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">comma</span>, 
                  <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded mx-1">semicolon</span>, or 
                  <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">pipe</span> to search multiple terms
                </p>              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Customer Filter</label>
                <button
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 text-gray-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <span className="text-sm">
                      {selectedCustomers.length === 0 
                        ? 'All Customers' 
                        : `${selectedCustomers.length} customer${selectedCustomers.length > 1 ? 's' : ''} selected`
                      }
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedCustomers.length > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                        {selectedCustomers.length}
                      </span>
                    )}
                    <div className="w-4 h-4 text-gray-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Pickup Date From</label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                  />
                  {dateFrom && (
                    <button
                      onClick={() => setDateFrom('')}
                      className="px-3 py-3 text-gray-500 hover:text-red-600 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-red-300 transition-all duration-200"
                      title="Clear date from"
                    >
                      <div className="w-4 h-4">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Pickup Date To</label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                  />
                  {dateTo && (
                    <button
                      onClick={() => setDateTo('')}
                      className="px-3 py-3 text-gray-500 hover:text-red-600 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-red-300 transition-all duration-200"
                      title="Clear date to"
                    >
                      <div className="w-4 h-4">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    </button>
                  )}                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Actions</label>
                <div className="flex flex-col space-y-2">
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
                  {(dateFrom || dateTo) && (
                    <button
                      onClick={() => {
                        setDateFrom('')
                        setDateTo('')
                      }}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-200 font-medium text-sm"
                    >
                      <div className="w-4 h-4">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <span>Clear All Dates</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg overflow-hidden">          <div className="p-6 border-b border-gray-200 dark:border-gray-600">
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
                  {filteredData.length} total records
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Show:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm text-gray-900 dark:text-white"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                  <span className="text-sm text-gray-600 dark:text-gray-400">per page</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length}
                </div>
              </div>
            </div>
          </div>            <div className="overflow-x-auto shadow-xl rounded-xl border border-gray-200 dark:border-gray-600">
            <table className="w-full min-w-max bg-white dark:bg-gray-800">
              <thead className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-700 dark:to-gray-600">
                <tr>                  <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700 dark:border-gray-500 w-16">
                    No
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700 dark:border-gray-500">Pick Up</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700 dark:border-gray-500">Berangkat</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700 dark:border-gray-500">No. SP</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700 dark:border-gray-500">No. SJ</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700 dark:border-gray-500">Customer</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700 dark:border-gray-500">Tujuan</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700 dark:border-gray-500">Qty</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700 dark:border-gray-500">Tgl. Diterima</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700 dark:border-gray-500">Penerima</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700 dark:border-gray-500">Dok. Balik</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-gray-700 dark:border-gray-500">No. Inv</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Tgl. Inv</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {paginatedData.map((row, index) => (
                  <tr key={`${row.id}-${currentPage}-${index}`} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 group">                    <td className="px-3 py-3 text-xs text-gray-500 dark:text-gray-400 border-r border-gray-100 dark:border-gray-700 w-16 text-center">
                      {startIndex + index + 1}
                    </td><td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white border-r border-gray-100 dark:border-gray-700">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="font-semibold">{formatDate(row.pick_up)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-r border-gray-100 dark:border-gray-700">
                      <span className="font-medium">{formatDate(row.berangkat)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm border-r border-gray-100 dark:border-gray-700">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm">
                        {row.no_sp}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm border-r border-gray-100 dark:border-gray-700">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        {row.no_sj || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-100 dark:border-gray-700 max-w-40">
                      <div className="truncate" title={row.customer || '-'}>
                        {row.customer || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-r border-gray-100 dark:border-gray-700 max-w-36">
                      <div className="truncate" title={row.tujuan || '-'}>
                        {row.tujuan || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-r border-gray-100 dark:border-gray-700">
                      <span className="font-medium">{row.qty || '-'}</span>
                    </td>                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-r border-gray-100 dark:border-gray-700">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        <span className="font-medium">{formatDate(row.diterima)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-r border-gray-100 dark:border-gray-700 max-w-32">
                      <div className="truncate font-medium" title={row.penerima || '-'}>
                        {row.penerima || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-r border-gray-100 dark:border-gray-700">
                      <span className="font-medium">{row.do_balik || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-sm border-r border-gray-100 dark:border-gray-700">
                      {row.no_invoice ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm">
                          <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                          {row.no_invoice}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                          <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                          No Invoice
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="font-medium">{formatDate(row.tanggal_invoice || null)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {filteredData.length > 0 && totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                    >
                      First
                    </button>
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                    >
                      <div className="w-5 h-5">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </div>
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 7) {
                        pageNum = i + 1
                      } else if (currentPage <= 4) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 6 + i
                      } else {
                        pageNum = currentPage - 3 + i
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                    >
                      <div className="w-5 h-5">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                    <button
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            )}
            
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
                  </div>                  <span>Refresh Data</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>      {/* Customer Selection Modal */}
      {isCustomerModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsCustomerModalOpen(false)}
        >          <div 
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full h-[85vh] flex flex-col transition-all duration-300 ${
              selectedCustomers.length > 1 ? 'max-w-4xl' : 'max-w-md'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Customers</h3>
              </div>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className={`flex-1 overflow-hidden ${selectedCustomers.length > 1 ? 'flex' : 'flex flex-col'}`}>              {/* Left Panel - Search and Customer List */}
              <div className={`${selectedCustomers.length > 1 ? 'flex-1 border-r border-gray-200 dark:border-gray-600' : 'flex-1'} flex flex-col min-h-0`}>
                {/* Search Input */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      autoFocus
                    />
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>                {/* Customer List */}
                <div className="flex-1 overflow-y-scroll min-h-0 max-h-full">
                  <div className="p-2 space-y-1">
                    {customers
                      .filter((customer) => 
                        customer.toLowerCase().includes(customerSearch.toLowerCase())
                      )
                      .map((customer) => (
                        <label
                          key={customer}
                          className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                            selectedCustomers.includes(customer)
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedCustomers.includes(customer)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCustomers((prev) => [...prev, customer])
                              } else {
                                setSelectedCustomers((prev) => prev.filter((c) => c !== customer))
                              }
                            }}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <span className={`text-sm font-medium flex-1 ${
                            selectedCustomers.includes(customer)
                              ? 'text-blue-900 dark:text-blue-100'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {customer}
                          </span>
                          {selectedCustomers.includes(customer) && (
                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </label>
                      ))}
                    
                    {customers.filter((customer) => 
                      customer.toLowerCase().includes(customerSearch.toLowerCase())
                    ).length === 0 && (
                      <div className="text-center py-8">
                        <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-sm text-gray-500 dark:text-gray-400">No customers found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Panel - Selected Customers (only show if multiple selected) */}
              {selectedCustomers.length > 1 && (
                <div className="w-80 flex flex-col bg-blue-50/30 dark:bg-blue-900/10">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-600 bg-blue-100/50 dark:bg-blue-900/20">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        Selected ({selectedCustomers.length})
                      </h4>
                      <button
                        onClick={() => setSelectedCustomers([])}
                        className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3">
                    <div className="space-y-2">
                      {selectedCustomers.map((customer, index) => (
                        <div
                          key={customer}
                          className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="flex items-center justify-center w-5 h-5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-bold">
                              {index + 1}
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {customer}
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedCustomers((prev) => prev.filter((c) => c !== customer))}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedCustomers.length} of {customers.length} customers selected
                </span>
                {selectedCustomers.length <= 1 && (
                  <button
                    onClick={() => setSelectedCustomers([])}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 font-medium"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
