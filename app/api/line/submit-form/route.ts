import { NextRequest, NextResponse } from 'next/server'
import { appendSheetData, ensureSheetExists } from '../../../../lib/google-sheets'
import { getSheetData } from '../../../../lib/google-sheets'
import { createFormConfirmMessage, createMatchResultMessage, lineClient } from '../../../../lib/line-client'

const SHEET_ID = process.env.NEXT_PUBLIC_SHEET_ID || ''

export async function POST(request: NextRequest) {
  try {
    const form = await request.json()
    const lineUserId = request.headers.get('x-line-user-id') || ''

    // 確保客戶需求表存在
    await ensureSheetExists(SHEET_ID, '客戶需求表')

    // 寫入 Google Sheet
    const headers = [
      '姓名', '電話', '性別', '入住人數', '同住關係', '年齡', '職業', '公司/學校',
      '找房區域', '房型需求', '物件型態', '車位需求', '預算', '抽菸', '寵物',
      '租屋補助', '入戶籍', '家具', '原租約到期', '預計起租', '決定速度', '特殊需求',
      '填寫時間', 'LINE用戶ID',
    ]

    const row = [
      form.name, form.phone, form.gender, form.residents, form.relationship,
      form.age, form.occupation, form.company, form.area, form.roomType,
      form.propertyType, form.parking, form.budget, form.smoking, form.pets,
      form.subsidy, form.registration, form.furniture, form.leaseEnd, form.moveIn,
      form.decision, form.special,
      new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }),
      lineUserId,
    ]

    // 如果是第一筆，先寫標題
    const existing = await getSheetData(SHEET_ID, '客戶需求表!A1:A2')
    if (existing.length === 0) {
      await appendSheetData(SHEET_ID, '客戶需求表!A1', [headers])
    }
    await appendSheetData(SHEET_ID, '客戶需求表!A1', [row])

    // 配對物件
    const allData = await getSheetData(SHEET_ID, '物件總表!A:Z')
    let matched: any[] = []

    if (allData.length > 1) {
      const colHeaders = allData[0]
      const statusIdx = colHeaders.indexOf('狀態')
      const districtIdx = colHeaders.indexOf('鄉鎮市區')
      const roomTypeIdx = colHeaders.indexOf('格局')
      const priceIdx = colHeaders.indexOf('月租金')
      const petsIdx = colHeaders.indexOf('寵物')
      const codeIdx = colHeaders.indexOf('編號')
      const addressIdx = colHeaders.indexOf('地址')
      const areaIdx = colHeaders.indexOf('登記坪數')

      const budget = parseInt(form.budget) || 999999

      matched = allData.slice(1).filter(row => {
        const status = (row[statusIdx] || '').toString()
        const district = (row[districtIdx] || '').toString()
        const roomType = (row[roomTypeIdx] || '').toString()
        const price = parseInt(row[priceIdx] || '0')
        const petAllowed = (row[petsIdx] || '').toString()

        const unavailable = ['已收訂等簽約', '維修中', '即將開放', '整理中', '下架', '已出租']
        if (unavailable.some(s => status.includes(s))) return false
        if (form.area) {
          const keywords = form.area.split(/[,，、\s]+/).map((k: string) => k.replace('區', '').trim()).filter(Boolean)
          const matched = keywords.some((k: string) => district.includes(k))
          if (!matched) return false
        }
        if (form.roomType) {
          if (form.roomType === '套房') {
            if (!roomType.includes('套房')) return false
          } else {
            if (!roomType.startsWith(form.roomType.replace('房', '') + '房')) return false
          }
        }
        if (price > budget) return false
        if (form.pets && form.pets !== '沒有' && petAllowed === '不可') return false

        return true
      }).map(row => ({
        code: row[codeIdx] || '',
        district: row[districtIdx] || '',
        address: row[addressIdx] || '',
        roomType: row[roomTypeIdx] || '',
        price: row[priceIdx] || 0,
        area: row[areaIdx] || '',
      }))
    }

    // 回傳 LINE 訊息
    if (lineUserId) {
      await lineClient.pushMessage({
        to: lineUserId,
        messages: [
          createFormConfirmMessage(form),
          createMatchResultMessage(matched),
        ],
      })
    }

    return NextResponse.json({ ok: true, matched: matched.length })
  } catch (error: any) {
    console.error('Submit form error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
