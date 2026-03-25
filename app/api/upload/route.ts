import { NextRequest, NextResponse } from 'next/server'
import { parseRagicExcel } from '../../../lib/excel-parser'
import { generateCode, initializeCodeGenerator } from '../../../lib/code-generator'
import { getSheetData, appendSheetData, ensureSheetExists, clearSheet, updateSheetData } from '../../../lib/google-sheets'

const SHEET_ID = process.env.NEXT_PUBLIC_SHEET_ID || ''

// 用戶指定的欄位（只有這 23 個）
const REQUIRED_COLUMNS = [
  '編號',
  '狀態',
  '案名',
  '鄉鎮市區',
  '地址',
  '格局',
  '月租金',
  '車位月租金',
  '房屋管理費',
  '物件型態',
  '所在樓層',
  '總樓層',
  '登記坪數',
  '主建坪數',
  '附屬建物坪',
  '公設坪數',
  '車位坪數',
  '開伙',
  '寵物',
  '屋齡',
  '進屋方式',
  '委託時間(迄)',
]

export async function POST(request: NextRequest) {
  try {
    if (!SHEET_ID) {
      return NextResponse.json(
        { error: '未設定 Google Sheet ID' },
        { status: 400 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: '未找到檔案' },
        { status: 400 }
      )
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Parse Excel
    const ragicData = await parseRagicExcel(buffer)

    if (ragicData.length === 0) {
      return NextResponse.json(
        { error: '無法解析檔案或檔案為空' },
        { status: 400 }
      )
    }

    // Ensure all required sheets exist
    await ensureSheetExists(SHEET_ID, '物件總表')
    await ensureSheetExists(SHEET_ID, '地區編碼對照')
    await ensureSheetExists(SHEET_ID, '序號記錄')

    // Initialize code generator
    await initializeCodeGenerator()

    // 讀取現有物件（保留已有編號，避免重新編碼）
    const existingCodeMap = new Map<string, string>() // address -> 編號
    try {
      const existingData = await getSheetData(SHEET_ID, '物件總表!A:E')
      if (existingData.length > 1) {
        for (let i = 1; i < existingData.length; i++) {
          const code = (existingData[i][0] || '').toString().trim()
          const address = (existingData[i][4] || '').toString().toLowerCase().trim()
          if (address && code) existingCodeMap.set(address, code)
        }
      }
    } catch (error: any) {
      console.log('無既存物件資料')
    }

    // Process properties
    const newRows = []
    let newCount = 0
    let updateCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (let i = 0; i < ragicData.length; i++) {
      try {
        const prop = ragicData[i]
        const address = (prop['地址'] || '').toString().toLowerCase().trim()
        if (!address) continue

        const city = (prop['縣市'] || '').toString().trim()
        const district = (prop['鄉鎮市區'] || '').toString().trim()
        const roomType = (prop['格局'] || '').toString().trim()

        // 使用現有編號，或生成新編號
        const code = existingCodeMap.has(address)
          ? existingCodeMap.get(address)!
          : await generateCode(city, district, roomType)

        if (existingCodeMap.has(address)) {
          updateCount++
        } else {
          newCount++
        }

        const newRow: any = {}
        REQUIRED_COLUMNS.forEach(field => {
          if (field === '編號') newRow[field] = code
          else if (field === '狀態') newRow[field] = prop['狀態'] || '在租'
          else newRow[field] = prop[field] !== undefined ? prop[field] : ''
        })
        newRows.push(newRow)
      } catch (err: any) {
        errorCount++
        errors.push(`第 ${i + 1} 筆：${err.message}`)
      }
    }

    // 清空物件總表，重新寫入
    await clearSheet(SHEET_ID, '物件總表!A:Z')

    if (newRows.length > 0) {
      const dataRows = newRows.map(row =>
        REQUIRED_COLUMNS.map(field => {
          const val = row[field]
          return val !== null && val !== undefined ? String(val) : ''
        })
      )
      await appendSheetData(SHEET_ID, '物件總表!A1', [REQUIRED_COLUMNS, ...dataRows])
    }

    return NextResponse.json({
      processedCount: ragicData.length,
      newCount,
      updateCount,
      errorCount,
      errors: errors.length > 0 ? errors : null,
      message: `✅ 新增 ${newCount} 筆，更新 ${updateCount} 筆`,
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || '上傳失敗' },
      { status: 500 }
    )
  }
}
