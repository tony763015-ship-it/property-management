import { NextRequest, NextResponse } from 'next/server'
import { parseRagicExcel } from '../../../lib/excel-parser'
import { generateCode, initializeCodeGenerator } from '../../../lib/code-generator'
import { getSheetData, appendSheetData, ensureSheetExists } from '../../../lib/google-sheets'

const SHEET_ID = process.env.NEXT_PUBLIC_SHEET_ID || ''

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
    const properties = await parseRagicExcel(buffer)

    if (properties.length === 0) {
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

    // Get existing properties from Google Sheet (skip if sheet doesn't exist yet)
    let existingAddresses = new Set<string>()
    try {
      const existingData = await getSheetData(SHEET_ID, '物件總表!A:A')
      existingAddresses = new Set(
        existingData.slice(1).map(row => row[0]?.toString().toLowerCase())
      )
    } catch (error: any) {
      // Sheet might be empty on first upload
      console.log('無既存物件資料')
    }

    // 定義欄位順序（根據用戶需求）
    const columnOrder = [
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

    // Process properties
    const newRows = []
    let newCount = 0
    let duplicateCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (let i = 0; i < properties.length; i++) {
      try {
        const prop = properties[i]

        // Check for duplicates by address
        const normalizedAddr = prop.address.toLowerCase().trim()
        if (existingAddresses.has(normalizedAddr)) {
          duplicateCount++
          continue
        }

        // Generate code
        const code = await generateCode(prop.city, prop.district, prop.roomType)

        // 按照欄位順序建立新列
        const newRow: any = {}
        columnOrder.forEach(field => {
          if (field === '編號') {
            newRow[field] = code
          } else if (field === '狀態') {
            newRow[field] = '在租'
          } else {
            // 從 properties 中找對應的值
            newRow[field] = prop[field] || prop[field.toLowerCase()] || ''
          }
        })

        newRows.push(newRow)
        newCount++
      } catch (err: any) {
        errorCount++
        errors.push(`第 ${i + 1} 筆：${err.message}`)
      }
    }

    // Append to Google Sheet
    if (newRows.length > 0) {
      // 按照定義的順序建立資料列
      const dataRows = newRows.map(row =>
        columnOrder.map(field => row[field] || '')
      )

      await appendSheetData(SHEET_ID, '物件總表!A1', [
        columnOrder,
        ...dataRows,
      ])
    }

    return NextResponse.json({
      processedCount: properties.length,
      newCount,
      duplicateCount,
      errorCount,
      errors: errors.length > 0 ? errors : null,
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || '上傳失敗' },
      { status: 500 }
    )
  }
}
