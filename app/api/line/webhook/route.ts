import { NextRequest, NextResponse } from 'next/server'
import * as line from '@line/bot-sdk'
import { lineConfig, lineClient, createWelcomeMessage, createPropertyDetailMessage } from '../../../../lib/line-client'
import { getSheetData } from '../../../../lib/google-sheets'

const LIFF_FORM_URL = process.env.LIFF_FORM_URL || ''
const SHEET_ID = process.env.NEXT_PUBLIC_SHEET_ID || ''
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://property-management-mocha-iota.vercel.app'

// 判斷是否為物件編號格式（例：BB2001、AA1005）
function isPropertyCode(text: string) {
  return /^[A-Za-z]{2}[1-9]\d{3}$/.test(text.trim())
}

async function findProperty(code: string) {
  try {
    const data = await getSheetData(SHEET_ID, '物件總表!A:Z')
    if (data.length < 2) return null
    const headers = data[0]
    const row = data.slice(1).find(r => (r[0] || '').toString().trim().toUpperCase() === code.toUpperCase())
    if (!row) return null
    const property: Record<string, string> = {}
    headers.forEach((h: string, i: number) => { property[h] = (row[i] || '').toString() })
    return property
  } catch { return null }
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-line-signature') || ''

  // 驗證簽名（若 Secret 未設定則跳過，避免部署初期失敗）
  if (lineConfig.channelSecret && signature) {
    if (!line.validateSignature(body, lineConfig.channelSecret, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  const events: line.WebhookEvent[] = JSON.parse(body).events

  for (const event of events) {
    try {
      // 用戶加入 → 歡迎訊息
      if (event.type === 'follow') {
        await lineClient.replyMessage({
          replyToken: event.replyToken,
          messages: [createWelcomeMessage(LIFF_FORM_URL)],
        })
      }

      // 文字訊息
      if (event.type === 'message' && event.message.type === 'text') {
        const text = event.message.text.trim()

        if (text === '找房' || text === '租屋' || text === '查詢' || text === '需求') {
          await lineClient.replyMessage({
            replyToken: event.replyToken,
            messages: [createWelcomeMessage(LIFF_FORM_URL)],
          })
        } else if (isPropertyCode(text)) {
          // 輸入物件編號 → 查詢並回覆詳細資訊
          const property = await findProperty(text.toUpperCase())
          if (property) {
            const detailUrl = `${BASE_URL}/liff/property/${text.toUpperCase()}`
            await lineClient.replyMessage({
              replyToken: event.replyToken,
              messages: [createPropertyDetailMessage(property, detailUrl)],
            })
          } else {
            await lineClient.replyMessage({
              replyToken: event.replyToken,
              messages: [{ type: 'text', text: `找不到編號 ${text.toUpperCase()} 的物件，請確認編號是否正確。` }],
            })
          }
        } else {
          await lineClient.replyMessage({
            replyToken: event.replyToken,
            messages: [{ type: 'text', text: '請點下方選單「填寫需求」開始找房！🏠\n\n若要查詢特定物件，請直接輸入物件編號（例：BB2001）' }],
          })
        }
      }
    } catch (err) {
      console.error('Webhook event error:', err)
    }
  }

  return NextResponse.json({ ok: true })
}
