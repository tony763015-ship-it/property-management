import { NextRequest, NextResponse } from 'next/server'
import { parseRagicExcel } from '../../../lib/excel-parser'
import { generateCode, initializeCodeGenerator } from '../../../lib/code-generator'
import { getSheetData, appendSheetData, ensureSheetExists, clearSheet, batchUpdateSheetData } from '../../../lib/google-sheets'
const SHEET_ID = process.env.NEXT_PUBLIC_SHEET_ID || ''
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || ''

const REQUIRED_COLUMNS = [
  '編號', '狀態', '案名', '鄉鎮市區', '地址', '格局', '月租金',
  '車位月租金', '房屋管理費', '物件型態', '所在樓層', '總樓層', '登記坪數',
  '主建坪數', '附屬建物坪', '公設坪數', '車位坪數', '開伙', '寵物', '屋齡',
  '進屋方式', '委託時間(迄)', '資料夾ID',
]

export async function POST(request: NextRequest) {
  try {
    if (!SHEET_ID) {
      return NextResponse.json({ error: '未設定 Google Sheet ID' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: '未找到檔案' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ragicData = await parseRagicExcel(buffer)
    if (ragicData.length === 0) {
      return NextResponse.json({ error: '無法解析檔案或檔案為空' }, { status: 400 })
    }

    // 確保分頁存在
    await ensureSheetExists(SHEET_ID, '物件總表')
    await ensureSheetExists(SHEET_ID, '下架物件')
    await ensureSheetExists(SHEET_ID, '地區編碼對照')
    await ensureSheetExists(SHEET_ID, '序號記錄')

    // 讀取現有在架物件（物件總表）
    const codeMap = new Map<string, string>()     // address → code
    const folderIdMap = new Map<string, string>() // address → Drive 資料夾ID
    const existingSeqMap = new Map<string, number>()

    try {
      const activeData = await getSheetData(SHEET_ID, '物件總表!A:Z')
      const folderColIdx = REQUIRED_COLUMNS.indexOf('資料夾ID')
      for (let i = 1; i < activeData.length; i++) {
        const code = (activeData[i][0] || '').toString().trim()
        const address = (activeData[i][4] || '').toString().toLowerCase().trim()
        if (address && code && code !== '編號') {
          codeMap.set(address, code)
          if (folderColIdx >= 0) folderIdMap.set(address, (activeData[i][folderColIdx] || '').toString().trim())
          const seqKey = code.slice(0, 3)
          const seq = parseInt(code.slice(3)) || 0
          if (!existingSeqMap.has(seqKey) || existingSeqMap.get(seqKey)! < seq) {
            existingSeqMap.set(seqKey, seq)
          }
        }
      }
    } catch { console.log('無在架物件資料') }

    // 讀取現有下架物件（下架物件分頁）
    try {
      const inactiveData = await getSheetData(SHEET_ID, '下架物件!A:Z')
      const folderColIdx = REQUIRED_COLUMNS.indexOf('資料夾ID')
      for (let i = 1; i < inactiveData.length; i++) {
        const code = (inactiveData[i][0] || '').toString().trim()
        const address = (inactiveData[i][4] || '').toString().toLowerCase().trim()
        if (address && code && code !== '編號') {
          codeMap.set(address, code)
          if (folderColIdx >= 0) folderIdMap.set(address, (inactiveData[i][folderColIdx] || '').toString().trim())
          const seqKey = code.slice(0, 3)
          const seq = parseInt(code.slice(3)) || 0
          if (!existingSeqMap.has(seqKey) || existingSeqMap.get(seqKey)! < seq) {
            existingSeqMap.set(seqKey, seq)
          }
        }
      }
    } catch { console.log('無下架物件資料') }

    await initializeCodeGenerator(existingSeqMap)

    // 處理新 Excel → 建立最終在架清單
    let newCount = 0
    let updateCount = 0
    let offlineCount = 0
    let restoreCount = 0
    let errorCount = 0
    const errors: string[] = []
    const activeRows: string[][] = []
    const newAddresses = new Set<string>()

    for (let i = 0; i < ragicData.length; i++) {
      try {
        const prop = ragicData[i]
        const address = (prop['地址'] || '').toString().toLowerCase().trim()
        if (!address) continue
        newAddresses.add(address)

        const city = (prop['縣市'] || '').toString().trim()
        const district = (prop['鄉鎮市區'] || '').toString().trim()
        const roomType = (prop['格局'] || '').toString().trim()
        const ragicStatus = (prop['狀態'] || '').toString().trim()

        let code: string
        let folderId = folderIdMap.get(address) || ''
        if (codeMap.has(address)) {
          code = codeMap.get(address)!
          updateCount++
        } else {
          code = await generateCode(city, district, roomType)
          newCount++
        }

        const status = ragicStatus || '代租中'
        const rowData = REQUIRED_COLUMNS.map(field => {
          if (field === '編號') return code
          if (field === '狀態') return status
          if (field === '資料夾ID') return folderId
          const val = prop[field]
          return val !== null && val !== undefined ? String(val) : ''
        })
        activeRows.push(rowData)
      } catch (err: any) {
        errorCount++
        errors.push(`第 ${i + 1} 筆：${err.message}`)
      }
    }

    const now = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
    const INACTIVE_COLUMNS = [...REQUIRED_COLUMNS, '下架時間']

    // 找出需要移到下架分頁的物件（原本在架但新 Excel 沒有）
    const inactiveRows: string[][] = []
    try {
      const activeData = await getSheetData(SHEET_ID, '物件總表!A:Z')
      for (let i = 1; i < activeData.length; i++) {
        const address = (activeData[i][4] || '').toString().toLowerCase().trim()
        if (!address || address === '地址') continue
        if (!newAddresses.has(address)) {
          const row = [...activeData[i]]
          row[1] = '下架'
          // 補齊欄位數到 REQUIRED_COLUMNS 長度，再加下架時間
          while (row.length < REQUIRED_COLUMNS.length) row.push('')
          row.push(now)
          inactiveRows.push(row)
          offlineCount++
        }
      }
    } catch { }

    // 保留原下架分頁中「新 Excel 沒有的」物件（已下架且未恢復）
    try {
      const prevInactive = await getSheetData(SHEET_ID, '下架物件!A:Z')
      for (let i = 1; i < prevInactive.length; i++) {
        const address = (prevInactive[i][4] || '').toString().toLowerCase().trim()
        if (!address || address === '地址') continue
        if (newAddresses.has(address)) {
          restoreCount++
        } else {
          const row = [...prevInactive[i]]
          // 若舊資料沒有下架時間欄，補上空字串
          while (row.length < INACTIVE_COLUMNS.length) row.push('')
          inactiveRows.push(row)
        }
      }
    } catch { }

    // 清空並重寫兩個分頁
    await clearSheet(SHEET_ID, '物件總表!A:Z')
    await appendSheetData(SHEET_ID, '物件總表!A1', [REQUIRED_COLUMNS, ...activeRows])

    await clearSheet(SHEET_ID, '下架物件!A:Z')
    await appendSheetData(SHEET_ID, '下架物件!A1', [INACTIVE_COLUMNS, ...inactiveRows])

    // 呼叫 Apps Script 建立新物件的 Drive 資料夾（背景執行，不等待）
    if (APPS_SCRIPT_URL && newCount > 0) {
      fetch(APPS_SCRIPT_URL).catch(() => {})
    }

    return NextResponse.json({
      processedCount: ragicData.length,
      newCount,
      updateCount,
      offlineCount,
      restoreCount,
      errorCount,
      errors: errors.length > 0 ? errors : null,
      message: `✅ 新增 ${newCount} 筆，更新 ${updateCount} 筆，下架 ${offlineCount} 筆，恢復 ${restoreCount} 筆`,
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message || '上傳失敗' }, { status: 500 })
  }
}
