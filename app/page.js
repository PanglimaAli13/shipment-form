'use client'
import { useState, useEffect } from 'react'
import { Calendar, Truck, Save, Search, User, CalendarDays, CheckCircle, AlertCircle } from 'lucide-react'

// Helper function untuk format date
const formatDateHelper = (dateString) => {
  if (!dateString) return { formatted: '', dayName: '' };
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return { formatted: '', dayName: '' };
    
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = days[date.getDay()];
    
    return {
      formatted: date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      dayName
    };
  } catch (error) {
    console.error('Error formatting date:', error);
    return { formatted: '', dayName: '' };
  }
}

export default function ShipmentForm() {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filledShipmentCount, setFilledShipmentCount] = useState(0);
  const [modal, setModal] = useState({
    isOpen: false,
    type: '',
    message: ''
  });

  // Fetch drivers on component mount
  useEffect(() => {
    fetchDrivers();
  }, []);

  // Hitung jumlah shipment terisi ketika data berubah
  useEffect(() => {
    try {
      const filledCount = shipments.filter(shipment => 
        shipment && shipment.shipment_code && shipment.shipment_code !== '-'
      ).length;
      setFilledShipmentCount(filledCount);
    } catch (error) {
      console.error('Error counting shipments:', error);
      setFilledShipmentCount(0);
    }
  }, [shipments]);

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/drivers');
      if (!response.ok) throw new Error('Failed to fetch drivers');
      const data = await response.json();
      setDrivers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setDrivers([]);
    }
  };

  const fetchShipments = async () => {
    if (!selectedDriver || !startDate || !endDate) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/shipments?nik_driver=${selectedDriver}&start_date=${startDate}&end_date=${endDate}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch shipments');
      
      const data = await response.json();
      
      // Generate date range and merge with existing data
      const dateRange = generateDateRange(startDate, endDate);
      const mergedData = dateRange.map(date => {
        const existing = Array.isArray(data) ? data.find(s => s && s.tanggal === date) : null;
        return {
          tanggal: date,
          shipment_code: existing?.shipment_code || '-',
          isSunday: new Date(date).getDay() === 0
        };
      });
      
      setShipments(mergedData);
    } catch (error) {
      console.error('Error fetching shipments:', error);
      showModal('error', 'Gagal memuat data shipment');
      setShipments([]);
    }
    setLoading(false);
  };

  const generateDateRange = (start, end) => {
    try {
      const dates = [];
      const startDateObj = new Date(start);
      const endDateObj = new Date(end);
      
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        return [];
      }
      
      for (let date = new Date(startDateObj); date <= endDateObj; date.setDate(date.getDate() + 1)) {
        dates.push(date.toISOString().split('T')[0]);
      }
      
      return dates;
    } catch (error) {
      console.error('Error generating date range:', error);
      return [];
    }
  };

  const handleShipmentChange = (index, value) => {
    try {
      const newShipments = [...shipments];
      if (newShipments[index]) {
        newShipments[index].shipment_code = value;
        setShipments(newShipments);
      }
    } catch (error) {
      console.error('Error handling shipment change:', error);
    }
  };

  const handleShipmentFocus = (index) => {
    try {
      const newShipments = [...shipments];
      if (newShipments[index] && newShipments[index].shipment_code === '-') {
        newShipments[index].shipment_code = '';
        setShipments(newShipments);
      }
    } catch (error) {
      console.error('Error handling shipment focus:', error);
    }
  };

  const handleShipmentBlur = (index) => {
    try {
      const newShipments = [...shipments];
      if (newShipments[index] && !newShipments[index].shipment_code) {
        newShipments[index].shipment_code = '-';
        setShipments(newShipments);
      }
    } catch (error) {
      console.error('Error handling shipment blur:', error);
    }
  };

  const saveShipment = async (tanggal, shipment_code, isExisting) => {
    if (!selectedDriver) return;

    const driver = drivers.find(d => d.nik_driver === selectedDriver);
    if (!driver) return;

    // Validasi 10 digit angka jika tidak kosong
    if (shipment_code && shipment_code !== '-' && !/^\d{10}$/.test(shipment_code)) {
      showModal('error', 'Shipment code harus 10 digit angka');
      return;
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
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menyimpan data');
      }

      // Tampilkan modal sukses berdasarkan apakah data baru atau update
      if (isExisting) {
        showModal('success_update', 'Data shipment berhasil diperbarui!');
      } else {
        showModal('success_save', 'Data shipment berhasil disimpan!');
      }

      // Refresh data untuk memastikan konsistensi
      fetchShipments();
    } catch (error) {
      console.error('Error saving shipment:', error);
      showModal('error', `Error: ${error.message}`);
    }
  };

  const showModal = (type, message) => {
    setModal({
      isOpen: true,
      type,
      message
    });
  };

  const closeModal = () => {
    setModal({
      isOpen: false,
      type: '',
      message: ''
    });
  };

  const getSelectedDriverName = () => {
    const driver = drivers.find(d => d.nik_driver === selectedDriver);
    return driver ? driver.nama_driver : '';
  };

  // Render individual table row untuk menghindari render issue
  const renderTableRow = (shipment, index) => {
    if (!shipment) return null;
    
    const dateInfo = formatDateHelper(shipment.tanggal);
    const isExistingData = shipment.shipment_code && shipment.shipment_code !== '-' && shipment.shipment_code !== '';
    
    return (
      <tr 
        key={shipment.tanggal || index}
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
            <div>
              <span className={`font-medium text-lg ${
                shipment.isSunday ? 'text-red-700' : 'text-gray-900'
              }`}>
                {dateInfo.formatted}
              </span>
              <div className={`text-sm ${
                shipment.isSunday ? 'text-red-600' : 'text-gray-500'
              }`}>
                {dateInfo.dayName}
              </div>
            </div>
          </div>
        </td>
        <td className="px-8 py-5">
          <div className="max-w-xs">
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={shipment.shipment_code || ''}
              onChange={(e) => {
                // Hanya allow angka
                const value = e.target.value.replace(/[^0-9]/g, '');
                handleShipmentChange(index, value);
              }}
              onFocus={() => handleShipmentFocus(index)}
              onBlur={() => handleShipmentBlur(index)}
              placeholder="Masukkan 10 digit angka"
              className={`w-36 px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-soft-sm ${
                shipment.shipment_code === '-' 
                  ? 'border-gray-200 bg-gray-50/50' 
                  : 'border-blue-100 bg-white'
              }`}
              maxLength={10}
            />
            {shipment.shipment_code !== '-' && shipment.shipment_code && shipment.shipment_code.length > 0 && shipment.shipment_code.length !== 10 && (
              <p className="text-xs text-red-500 mt-2">
                Shipment code harus 10 digit angka
              </p>
            )}
          </div>
        </td>
        <td className="px-5 py-5">
          <button
            onClick={() => saveShipment(shipment.tanggal, shipment.shipment_code, isExistingData)}
            disabled={!shipment.shipment_code || shipment.shipment_code === '-' || (shipment.shipment_code.length > 0 && shipment.shipment_code.length !== 10)}
            className="group flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-soft-sm hover:shadow-soft disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
          >
            <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
            {isExistingData ? 'Perbarui' : 'Simpan'}
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Modal Component */}
        {modal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-soft-xl max-w-md w-full p-8 animate-fade-in">
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  modal.type === 'error' 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-green-100 text-green-600'
                }`}>
                  {modal.type === 'error' ? (
                    <AlertCircle className="w-8 h-8" />
                  ) : (
                    <CheckCircle className="w-8 h-8" />
                  )}
                </div>
                
                <h3 className={`text-xl font-bold mb-2 ${
                  modal.type === 'error' ? 'text-red-800' : 'text-green-800'
                }`}>
                  {modal.type === 'success_save' && 'Berhasil Disimpan!'}
                  {modal.type === 'success_update' && 'Berhasil Diperbarui!'}
                  {modal.type === 'error' && 'Terjadi Kesalahan!'}
                </h3>
                
                <p className="text-gray-600 mb-6">
                  {modal.message}
                </p>
                
                <button
                  onClick={closeModal}
                  className={`w-full py-3 px-6 rounded-xl font-semibold text-white ${
                    modal.type === 'error' 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-green-500 hover:bg-green-600'
                  } transition-all duration-200`}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

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
                  {Array.isArray(drivers) && drivers.map((driver) => (
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
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-0 bg-white/40 shadow-soft-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300"
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
              className="group relative bg-gradient-to-r from-cyan-500 to-blue-700 text-white py-4 px-10 rounded-2xl font-semibold shadow-soft-lg hover:shadow-soft-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 flex items-center gap-3"
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

        {/* Statistics Card */}
        {shipments.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-xl p-6 mb-6 border border-white/60">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {shipments.length}
                </div>
                <div className="text-gray-600">Total Hari</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {filledShipmentCount}
                </div>
                <div className="text-gray-600">Shipment Terisi</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {shipments.filter(s => s && s.isSunday).length}
                </div>
                <div className="text-gray-600">Hari Minggu</div>
              </div>
            </div>
            {selectedDriver && (
              <div className="text-center mt-4 pt-4 border-t border-gray-200/60">
                <p className="text-gray-600">
                  Driver: <span className="font-semibold text-gray-800">{getSelectedDriverName()}</span>
                </p>
              </div>
            )}
          </div>
        )}

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
                Periode: {formatDateHelper(startDate).formatted} - {formatDateHelper(endDate).formatted}
              </p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200/60">
                    <th className="px-8 py-5 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-8 py-5 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Shipment Code
                    </th>
                    <th className="px-8 py-5 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/60">
                  {shipments.map((shipment, index) => renderTableRow(shipment, index))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="bg-gray-50/80 px-8 py-4 border-t border-gray-200/60">
              <p className="text-sm text-gray-600">
                Menampilkan {shipments.length} hari • 
                <span className="text-green-600 ml-2">
                  {filledShipmentCount} shipment terisi
                </span>
                • <span className="text-red-500 ml-2">
                  {shipments.filter(s => s && s.isSunday).length} hari Minggu
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