import { NextRequest, NextResponse } from 'next/server'
import { getSheetData } from '../../../lib/google-sheets'

const SHEET_ID = process.env.NEXT_PUBLIC_SHEET_ID || ''

export async function GET(request: NextRequest) {
  try {
    if (!SHEET_ID) {
      return NextResponse.json(
        { error: '未設定 Google Sheet ID' },
        { status: 400 }
      )
    }

    // Get all properties from Google Sheet
    const data = await getSheetData(SHEET_ID, '物件總表!A:K')

    if (data.length <= 1) {
      return NextResponse.json([])
    }

    // Skip header and convert to property objects
    const properties = data.slice(1).map(row => ({
      code: row[0] || '',
      city: row[1] || '',
      district: row[2] || '',
      address: row[3] || '',
      roomType: row[4] || '',
      price: parseInt(row[5] || '0'),
      status: row[6] || '在租',
      area: row[7] ? parseFloat(row[7]) : undefined,
      floor: row[8] || '',
      phone: row[9] || '',
      remarks: row[10] || '',
    }))

    // Filter out empty rows
    const filtered = properties.filter(p => p.code && p.address)

    return NextResponse.json(filtered)
  } catch (error: any) {
    console.error('Get properties error:', error)
    return NextResponse.json(
      { error: error.message || '取得物件失敗' },
      { status: 500 }
    )
  }
}
