import { NextRequest, NextResponse } from 'next/server'
import { getDriveImageBuffer } from '../../../../../lib/google-drive'

export async function GET(request: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  try {
    const { fileId } = await params
    const { buffer, mimeType } = await getDriveImageBuffer(fileId)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
