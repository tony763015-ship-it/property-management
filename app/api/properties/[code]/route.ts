import { NextRequest, NextResponse } from 'next/server'
import { getSheetData, updateSheetData } from '../../../../lib/google-sheets'

const SHEET_ID = process.env.NEXT_PUBLIC_SHEET_ID || ''

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    if (!SHEET_ID) {
      return NextResponse.json(
        { error: '未設定 Google Sheet ID' },
        { status: 400 }
      )
    }

    const { code } = await params
    const { status } = await request.json()

    if (!status) {
      return NextResponse.json(
        { error: '未提供狀態' },
        { status: 400 }
      )
    }

    // Get all properties to find the row index
    const data = await getSheetData(SHEET_ID, '物件總表!A:K')

    const rowIndex = data.findIndex(row => row[0]?.toString().trim() === code)

    if (rowIndex === -1) {
      return NextResponse.json(
        { error: '物件不存在' },
        { status: 404 }
      )
    }

    // Update the status (column G is index 6, row index + 1 for header)
    const updateRange = `物件總表!G${rowIndex + 1}`
    await updateSheetData(SHEET_ID, updateRange, [[status]])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Update property error:', error)
    return NextResponse.json(
      { error: error.message || '更新失敗' },
      { status: 500 }
    )
  }
}
