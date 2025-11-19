import { NextResponse } from 'next/server'
import pool from '../../../lib/db'  // Gunakan relative path

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const nik_driver = searchParams.get('nik_driver')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')

    const result = await pool.query(
      `SELECT tanggal, shipment_code 
       FROM shipment 
       WHERE nik_driver = $1 AND tanggal BETWEEN $2 AND $3 
       ORDER BY tanggal`,
      [nik_driver, start_date, end_date]
    )
    
    return NextResponse.json(result.rows)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { nik_driver, nama_driver, tanggal, shipment_code } = await request.json()

    // Validasi 10 digit angka
    if (shipment_code && shipment_code !== '-' && !/^\d{10}$/.test(shipment_code)) {
      return NextResponse.json(
        { error: 'Shipment code harus 10 digit angka' }, 
        { status: 400 }
      )
    }

    const result = await pool.query(
      `INSERT INTO shipment (nik_driver, nama_driver, tanggal, shipment_code) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (nik_driver, tanggal) 
       DO UPDATE SET shipment_code = $4`,
      [nik_driver, nama_driver, tanggal, shipment_code === '-' ? null : shipment_code]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}