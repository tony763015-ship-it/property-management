import { NextRequest, NextResponse } from 'next/server'
import { getSheetData, batchUpdateSheetData } from '../../../../lib/google-sheets'
import { ensureDriveFolder, ensurePropertyDoc } from '../../../../lib/google-drive'

const SHEET_ID = process.env.NEXT_PUBLIC_SHEET_ID || ''
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || ''

export const maxDuration = 60 // Vercel 最長 60 秒

export async function GET(request: NextRequest) {
  if (!DRIVE_FOLDER_ID) {
    return NextResponse.json({ error: '未設定 GOOGLE_DRIVE_FOLDER_ID' }, { status: 400 })
  }

  try {
    const allData = await getSheetData(SHEET_ID, '物件總表!A:Z')
    if (allData.length < 2) return NextResponse.json({ message: '無物件資料' })

    const headers = allData[0]
    const codeIdx = headers.indexOf('編號')
    const nameIdx = headers.indexOf('案名')
    const folderIdx = headers.indexOf('資料夾ID')

    if (folderIdx === -1) {
      return NextResponse.json({ error: '物件總表缺少「資料夾ID」欄位，請先重新上傳一次 Excel' }, { status: 400 })
    }

    // 找出沒有資料夾ID的物件
    const needsFolders = allData.slice(1)
      .map((row, i) => ({ row, rowIndex: i + 2 }))
      .filter(({ row }) => !(row[folderIdx] || '').toString().trim())

    if (needsFolders.length === 0) {
      return NextResponse.json({ message: '所有物件已有資料夾，無需建立', created: 0 })
    }

    // 每次最多平行處理 5 個，避免超時
    const BATCH = 5
    const updates: { range: string; values: any[][] }[] = []
    let created = 0
    let failed = 0
    let firstError = ''

    for (let i = 0; i < needsFolders.length; i += BATCH) {
      const batch = needsFolders.slice(i, i + BATCH)
      await Promise.all(batch.map(async ({ row, rowIndex }) => {
        try {
          const code = (row[codeIdx] || '').toString().trim()
          const name = (row[nameIdx] || '').toString().trim()
          const folderName = `${code} ${name}`.trim()
          const folderId = await ensureDriveFolder(DRIVE_FOLDER_ID, folderName)
          await ensurePropertyDoc(folderId, '物件介紹')
          const endCol = String.fromCharCode(64 + folderIdx + 1)
          updates.push({
            range: `物件總表!${endCol}${rowIndex}`,
            values: [[folderId]],
          })
          created++
        } catch (e: any) {
          if (!firstError) firstError = e?.message || String(e)
          failed++
        }
      }))
    }

    // 批次寫回資料夾ID
    if (updates.length > 0) {
      await batchUpdateSheetData(SHEET_ID, updates)
    }

    return NextResponse.json({
      message: `✅ 建立完成`,
      created,
      failed,
      total: needsFolders.length,
      firstError,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
