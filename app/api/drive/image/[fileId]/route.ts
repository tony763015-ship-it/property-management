import { NextRequest, NextResponse } from 'next/server'
import { getDriveImageStream } from '../../../../../lib/google-drive'

export async function GET(request: NextRequest, { params }: { params: { fileId: string } }) {
  try {
    const stream = await getDriveImageStream(params.fileId)
    const chunks: Buffer[] = []
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk))
      stream.on('end', resolve)
      stream.on('error', reject)
    })
    const buffer = Buffer.concat(chunks)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
