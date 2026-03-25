import { NextRequest, NextResponse } from 'next/server'
import { getSheetData } from '../../../../lib/google-sheets'

const SHEET_ID = process.env.NEXT_PUBLIC_SHEET_ID || ''

export async function POST(request: NextRequest) {
  try {
    const { city, district, roomType, budget, pets } = await request.json()

    const allData = await getSheetData(SHEET_ID, '物件總表!A:Z')
    if (allData.length <= 1) {
      return NextResponse.json({ matched: [] })
    }

    const colHeaders = allData[0]
    const statusIdx = colHeaders.indexOf('狀態')
    const districtIdx = colHeaders.indexOf('鄉鎮市區')
    const roomTypeIdx = colHeaders.indexOf('格局')
    const priceIdx = colHeaders.indexOf('月租金')
    const petsIdx = colHeaders.indexOf('寵物')
    const codeIdx = colHeaders.indexOf('編號')
    const addressIdx = colHeaders.indexOf('地址')
    const areaIdx = colHeaders.indexOf('登記坪數')
    const floorIdx = colHeaders.indexOf('所在樓層')
    const totalFloorIdx = colHeaders.indexOf('總樓層')
    const typeIdx = colHeaders.indexOf('物件型態')

    const budgetNum = parseInt(budget) || 999999

    const matched = allData.slice(1).filter(row => {
      const status = (row[statusIdx] || '').toString()
      const rowDistrict = (row[districtIdx] || '').toString()
      const rowRoomType = (row[roomTypeIdx] || '').toString()
      const price = parseInt(row[priceIdx] || '0')
      const petAllowed = (row[petsIdx] || '').toString()

      if (status !== '委託中' && status !== '在租') return false
      if (district && !rowDistrict.includes(district.replace('區', ''))) return false
      if (roomType && !rowRoomType.includes(roomType.replace('房', ''))) return false
      if (price > budgetNum) return false
      if (pets && pets !== '不限' && petAllowed === '不可') return false

      return true
    }).map(row => ({
      code: row[codeIdx] || '',
      district: row[districtIdx] || '',
      address: (row[addressIdx] || '').replace(/\d+號?/, 'xxx號'),
      roomType: row[roomTypeIdx] || '',
      price: row[priceIdx] || 0,
      area: row[areaIdx] || '',
      floor: row[floorIdx] || '',
      totalFloor: row[totalFloorIdx] || '',
      type: row[typeIdx] || '',
    }))

    return NextResponse.json({ matched })
  } catch (error: any) {
    console.error('Quick search error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
