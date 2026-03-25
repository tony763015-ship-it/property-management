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

    // 讀取現有所有物件（包含隱藏的）→ 地址永久綁定編號
    interface ExistingRow { code: string; rowIndex: number }
    const existingCodeMap = new Map<string, ExistingRow>() // address -> { code, rowIndex }
    const existingSeqMap = new Map<string, number>()       // seqKey -> 最大序號
    let hasHeader = false

    try {
      const existingData = await getSheetData(SHEET_ID, '物件總表!A:Z')
      if (existingData.length > 0) {
        hasHeader = true
        for (let i = 1; i < existingData.length; i++) {
          const code = (existingData[i][0] || '').toString().trim()
          const address = (existingData[i][4] || '').toString().toLowerCase().trim()
          if (address && code) {
            existingCodeMap.set(address, { code, rowIndex: i + 1 })
            const seqKey = code.slice(0, 3)
            const seq = parseInt(code.slice(3)) || 0
            if (!existingSeqMap.has(seqKey) || existingSeqMap.get(seqKey)! < seq) {
              existingSeqMap.set(seqKey, seq)
            }
          }
        }
      }
    } catch (error: any) {
      console.log('無既存物件資料')
    }

    await initializeCodeGenerator(existingSeqMap)

    // 如果是第一次（無標題列），先寫入標題
    if (!hasHeader) {
      await appendSheetData(SHEET_ID, '物件總表!A1', [REQUIRED_COLUMNS])
    }

    // 新 Excel 中的地址集合
    const newAddresses = new Set<string>()
    for (const prop of ragicData) {
      const address = (prop['地址'] || '').toString().toLowerCase().trim()
      if (address) newAddresses.add(address)
    }

    let newCount = 0
    let updateCount = 0
    let hideCount = 0
    let errorCount = 0
    const errors: string[] = []
    const rowsToUpdate: Array<{ rowIndex: number; data: string[] }> = []
    const rowsToAdd: string[][] = []

    // 處理新 Excel 中的每筆資料
    for (let i = 0; i < ragicData.length; i++) {
      try {
        const prop = ragicData[i]
        const address = (prop['地址'] || '').toString().toLowerCase().trim()
        if (!address) continue

        const city = (prop['縣市'] || '').toString().trim()
        const district = (prop['鄉鎮市區'] || '').toString().trim()
        const roomType = (prop['格局'] || '').toString().trim()
        const ragicStatus = (prop['狀態'] || '').toString().trim()

        // 地址已存在 → 用舊編號；否則生成新編號
        let code: string
        const isExisting = existingCodeMap.has(address)
        if (isExisting) {
          code = existingCodeMap.get(address)!.code
          updateCount++
        } else {
          code = await generateCode(city, district, roomType)
          newCount++
        }

        // 直接保留 Ragic 原始狀態
        const status = ragicStatus || '在租'

        const rowData = REQUIRED_COLUMNS.map(field => {
          if (field === '編號') return code
          if (field === '狀態') return status
          const val = prop[field]
          return val !== null && val !== undefined ? String(val) : ''
        })

        if (isExisting) {
          rowsToUpdate.push({ rowIndex: existingCodeMap.get(address)!.rowIndex, data: rowData })
        } else {
          rowsToAdd.push(rowData)
        }
      } catch (err: any) {
        errorCount++
        errors.push(`第 ${i + 1} 筆：${err.message}`)
      }
    }

    // 不在新 Excel 中的舊物件 → 自動隱藏（狀態改為已出租）
    for (const [address, existing] of existingCodeMap.entries()) {
      if (!newAddresses.has(address)) {
        rowsToUpdate.push({ rowIndex: existing.rowIndex, data: null as any })
        hideCount++
      }
    }

    // 更新現有列
    for (const update of rowsToUpdate) {
      if (update.data === null) {
        // 只更新狀態欄為「已出租」
        await updateSheetData(SHEET_ID, `物件總表!B${update.rowIndex}`, [['已出租']])
      } else {
        const endCol = String.fromCharCode(64 + REQUIRED_COLUMNS.length)
        await updateSheetData(
          SHEET_ID,
          `物件總表!A${update.rowIndex}:${endCol}${update.rowIndex}`,
          [update.data]
        )
      }
    }

    // 新增新列
    if (rowsToAdd.length > 0) {
      await appendSheetData(SHEET_ID, '物件總表!A1', rowsToAdd)
    }

    return NextResponse.json({
      processedCount: ragicData.length,
      newCount,
      updateCount,
      hideCount,
      errorCount,
      errors: errors.length > 0 ? errors : null,
      message: `✅ 新增 ${newCount} 筆，更新 ${updateCount} 筆，隱藏 ${hideCount} 筆`,
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || '上傳失敗' },
      { status: 500 }
    )
  }
}
