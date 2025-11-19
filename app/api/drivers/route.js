import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    const result = await pool.query('SELECT nik_driver, nama_driver FROM users ORDER BY nama_driver')
    return NextResponse.json(result.rows)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}