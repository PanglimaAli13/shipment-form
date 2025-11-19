'use client'
import { useState, useEffect } from 'react'
import { Calendar, Truck, Save, Search, User, CalendarDays } from 'lucide-react'

export default function ShipmentForm() {
  const [drivers, setDrivers] = useState([])
  const [selectedDriver, setSelectedDriver] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(false)

  // Fetch drivers on component mount
  useEffect(() => {
    fetchDrivers()
  }, [])

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/drivers')
      const data = await response.json()
      setDrivers(data)
    } catch (error) {
      console.error('Error fetching drivers:', error)
    }
  }

  const fetchShipments = async () => {
    if (!selectedDriver || !startDate || !endDate) return

    setLoading(true)
    try {
      const response = await fetch(
        `/api/shipments?nik_driver=${selectedDriver}&start_date=${startDate}&end_date=${endDate}`
      )
      const data = await response.json()
      
      // Generate date range and merge with existing data
      const dateRange = generateDateRange(startDate, endDate)
      const mergedData = dateRange.map(date => {
        const existing = data.find(s => s.tanggal === date)
        return {
          tanggal: date,
          shipment_code: existing?.shipment_code || '-',
          isSunday: new Date(date).getDay() === 0
        }
      })
      
      setShipments(mergedData)
    } catch (error) {
      console.error('Error fetching shipments:', error)
    }
    setLoading(false)
  }

  const generateDateRange = (start, end) => {
    const dates = []
    const startDate = new Date(start)
    const endDate = new Date(end)
    
    for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
      dates.push(date.toISOString().split('T')[0])
    }
    
    return dates
  }

  const handleShipmentChange = (index, value) => {
    const newShipments = [...shipments]
    newShipments[index].shipment_code = value
    setShipments(newShipments)
  }

  const saveShipment = async (tanggal, shipment_code) => {
    if (!selectedDriver) return

    const driver = drivers.find(d => d.nik_driver === selectedDriver)
    if (!driver) return

    // Validasi 10 digit angka jika tidak kosong
    if (shipment_code && shipment_code !== '-' && !/^\d{10}$/.test(shipment_code)) {
      alert('Shipment code harus 10 digit angka')
      return
    }

    try {
      const response = await fetch('/api/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nik_driver: selectedDriver,
          nama_driver: driver.nama_driver,
          tanggal,
          shipment_code: shipment_code === '-' ? '' : shipment_code
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Gagal menyimpan data')
      }

      alert('Data berhasil disimpan!')
    } catch (error) {
      console.error('Error saving shipment:', error)
      alert('Error: ' + error.message)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 mt-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl shadow-soft-lg mb-6">
            <Truck className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Selamat Datang di Form Input Shipment
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Kelola data shipment driver dengan mudah dan efisien
          </p>
        </div>

        {/* Form Input Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-xl p-8 mb-8 border border-white/60">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Driver Selection */}
            <div className="lg:col-span-2">
              <div className="mb-3">
                <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" />
                  NAMA DRIVER
                </span>
              </div>
              <div className="relative">
                <select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border-0 bg-white/70 shadow-soft-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300 appearance-none cursor-pointer"
                >
                  <option value="">Pilih Driver</option>
                  {drivers.map((driver) => (
                    <option key={driver.nik_driver} value={driver.nik_driver}>
                      {driver.nama_driver}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <div className="w-2 h-2 border-r-2 border-b-2 border-gray-400 rotate-45"></div>
                </div>
              </div>
            </div>

            {/* Start Date */}
            <div>
              <div className="mb-3">
                <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-blue-500" />
                  TANGGAL MULAI
                </span>
              </div>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-0 bg-white/70 shadow-soft-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300"
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <div className="mb-3">
                <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-blue-500" />
                  TANGGAL SELESAI
                </span>
              </div>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-0 bg-white/70 shadow-soft-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* Load Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={fetchShipments}
              disabled={!selectedDriver || !startDate || !endDate || loading}
              className="group relative bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-12 rounded-2xl font-semibold shadow-soft-lg hover:shadow-soft-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 flex items-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Memuat Data...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Tampilkan Data Shipment
                </>
              )}
            </button>
          </div>
        </div>

        {/* Shipment Table */}
        {shipments.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-xl overflow-hidden border border-white/60">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100/80 px-8 py-6 border-b border-gray-200/60">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                Data Shipment
              </h2>
              <p className="text-gray-600 mt-1">
                Periode: {formatDate(startDate)} - {formatDate(endDate)}
              </p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200/60">
                    <th className="px-8 py-5 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-8 py-5 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Shipment Code
                    </th>
                    <th className="px-8 py-5 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/60">
                  {shipments.map((shipment, index) => (
                    <tr 
                      key={shipment.tanggal}
                      className={`transition-all duration-200 hover:bg-white/50 ${
                        shipment.isSunday 
                          ? 'bg-red-50/80 hover:bg-red-100/50' 
                          : 'even:bg-gray-50/30'
                      }`}
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            shipment.isSunday ? 'bg-red-400' : 'bg-blue-400'
                          }`}></div>
                          <span className={`font-medium text-lg ${
                            shipment.isSunday ? 'text-red-700' : 'text-gray-900'
                          }`}>
                            {formatDate(shipment.tanggal)}
                          </span>
                          {shipment.isSunday && (
                            <span className="text-xs text-red-600 bg-red-100 px-3 py-1 rounded-full font-medium">
                              Minggu
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="max-w-xs">
                          <input
                            type="text"
                            value={shipment.shipment_code}
                            onChange={(e) => handleShipmentChange(index, e.target.value)}
                            placeholder="Masukkan 10 digit shipment code"
                            className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-soft-sm ${
                              shipment.shipment_code === '-' 
                                ? 'border-gray-200 bg-gray-50/50' 
                                : 'border-blue-100 bg-white'
                            }`}
                            maxLength={10}
                          />
                          {shipment.shipment_code !== '-' && shipment.shipment_code.length > 0 && shipment.shipment_code.length !== 10 && (
                            <p className="text-xs text-red-500 mt-2">
                              Shipment code harus 10 digit angka
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <button
                          onClick={() => saveShipment(shipment.tanggal, shipment.shipment_code)}
                          disabled={shipment.shipment_code === '-' || (shipment.shipment_code.length > 0 && shipment.shipment_code.length !== 10)}
                          className="group flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-soft-sm hover:shadow-soft disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                        >
                          <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          Simpan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="bg-gray-50/80 px-8 py-4 border-t border-gray-200/60">
              <p className="text-sm text-gray-600">
                Menampilkan {shipments.length} hari • 
                <span className="text-red-500 ml-2">
                  {shipments.filter(s => s.isSunday).length} hari Minggu
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {shipments.length === 0 && selectedDriver && startDate && endDate && !loading && (
          <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-xl border border-white/60">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Truck className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Data Tidak Ditemukan
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Tidak ada data shipment untuk periode yang dipilih. 
              Silakan isi data shipment pada tabel di atas.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}