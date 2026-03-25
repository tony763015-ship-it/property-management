import { NextRequest, NextResponse } from 'next/server'
import * as line from '@line/bot-sdk'
import { lineConfig, lineClient, createWelcomeMessage } from '../../../../lib/line-client'

const LIFF_FORM_URL = process.env.LIFF_FORM_URL || ''

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
        } else {
          await lineClient.replyMessage({
            replyToken: event.replyToken,
            messages: [
              {
                type: 'text',
                text: '請點下方選單「填寫需求」開始找房！🏠',
              },
            ],
          })
        }
      }
    } catch (err) {
      console.error('Webhook event error:', err)
    }
  }

  return NextResponse.json({ ok: true })
}
