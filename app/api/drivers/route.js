//app/api/drivers/route.js

import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await pool.query(
      'SELECT nik_driver, nama_driver FROM users ORDER BY nama_driver'
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('API /drivers error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
