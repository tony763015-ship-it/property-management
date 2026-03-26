import { NextRequest, NextResponse } from 'next/server'
import { getSheetData } from '../../../../lib/google-sheets'
import { getFolderImages, getDocText } from '../../../../lib/google-drive'

const SHEET_ID = process.env.NEXT_PUBLIC_SHEET_ID || ''

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params

    // 從物件總表找這個編號
    const allData = await getSheetData(SHEET_ID, '物件總表!A:Z')
    if (allData.length < 2) return NextResponse.json({ error: '找不到物件' }, { status: 404 })

    const headers = allData[0]
    const row = allData.slice(1).find(r => (r[0] || '').toString().trim().toUpperCase() === code.toUpperCase())
    if (!row) return NextResponse.json({ error: '找不到物件' }, { status: 404 })

    // 組成物件資料
    const property: Record<string, string> = {}
    headers.forEach((h: string, i: number) => { property[h] = (row[i] || '').toString() })

    const folderId = property['資料夾ID'] || ''
    let images: { id: string; name: string; isCover: boolean }[] = []
    let description = ''

    if (folderId) {
      try { images = await getFolderImages(folderId) } catch { }
      try { description = await getDocText(folderId) } catch { }
    }

    return NextResponse.json({ property, images, description })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
