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

    const { searchParams } = new URL(request.url)
    const cities = searchParams.getAll('cities')
    const districts = searchParams.getAll('districts')
    const roomTypes = searchParams.getAll('roomTypes')
    const maxPriceStr = searchParams.get('maxPrice')
    const maxPrice = maxPriceStr ? parseInt(maxPriceStr) : null

    // Get all properties from Google Sheet
    const data = await getSheetData(SHEET_ID, '物件總表!A:K')

    if (data.length <= 1) {
      return NextResponse.json([])
    }

    // Convert to property objects
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
    }))

    // Filter
    const filtered = properties.filter(p => {
      // Must have code and address
      if (!p.code || !p.address) return false

      // Must be available (在租)
      if (p.status !== '在租') return false

      // City filter (required)
      if (cities.length > 0 && !cities.includes(p.city)) return false

      // District filter
      if (districts.length > 0 && !districts.includes(p.district)) return false

      // Room type filter
      if (roomTypes.length > 0) {
        // Extract room count from roomType
        const roomMatch = p.roomType.match(/(\d+)房/)
        if (!roomMatch) return false

        const roomCount = parseInt(roomMatch[1])
        const matches = roomTypes.some(type => {
          if (type === '套房') return p.roomType.includes('套房')
          if (type === '5房以上') return roomCount >= 5
          const typeNum = parseInt(type)
          return roomCount === typeNum
        })
        if (!matches) return false
      }

      // Price filter
      if (maxPrice !== null && p.price > maxPrice) return false

      return true
    })

    return NextResponse.json(filtered)
  } catch (error: any) {
    console.error('Match error:', error)
    return NextResponse.json(
      { error: error.message || '查詢失敗' },
      { status: 500 }
    )
  }
}
