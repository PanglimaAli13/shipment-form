'use client'
import { useState, useEffect } from 'react'
import { Calendar, Truck, Save } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
            <Truck className="text-blue-600" />
            Selamat Datang di Form Input Shipment
          </h1>
          <p className="text-gray-600">Kelola data shipment driver dengan mudah</p>
        </div>

        {/* Form Input */}
        <div className="bg-white rounded-2xl shadow-soft p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Driver Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NAMA DRIVER
              </label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Pilih Driver</option>
                {drivers.map((driver) => (
                  <option key={driver.nik_driver} value={driver.nik_driver}>
                    {driver.nama_driver}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                TANGGAL MULAI
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                TANGGAL SELESAI
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Load Button */}
          <div className="mt-6">
            <button
              onClick={fetchShipments}
              disabled={!selectedDriver || !startDate || !endDate}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-soft"
            >
              {loading ? 'Memuat Data...' : 'Tampilkan Data Shipment'}
            </button>
          </div>
        </div>

        {/* Shipment Table */}
        {shipments.length > 0 && (
          <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Tanggal
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Shipment
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {shipments.map((shipment, index) => (
                    <tr 
                      key={shipment.tanggal}
                      className={shipment.isSunday ? 'bg-red-50' : 'hover:bg-gray-50 transition-colors duration-150'}
                    >
                      <td className="px-6 py-4">
                        <span className={`font-medium ${shipment.isSunday ? 'text-red-700' : 'text-gray-900'}`}>
                          {formatDate(shipment.tanggal)}
                        </span>
                        {shipment.isSunday && (
                          <span className="ml-2 text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
                            Minggu
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={shipment.shipment_code}
                          onChange={(e) => handleShipmentChange(index, e.target.value)}
                          placeholder="Masukkan 10 digit shipment code"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          maxLength={10}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => saveShipment(shipment.tanggal, shipment.shipment_code)}
                          disabled={shipment.shipment_code === '-'}
                          className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          <Save className="w-4 h-4" />
                          Simpan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}