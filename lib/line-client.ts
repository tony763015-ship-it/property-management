import * as line from '@line/bot-sdk'

export const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
}

export const lineClient = new line.messagingApi.MessagingApiClient({
  channelAccessToken: lineConfig.channelAccessToken,
})

// 歡迎 Flex Message
export function createWelcomeMessage(liffFormUrl: string): line.FlexMessage {
  return {
    type: 'flex',
    altText: '歡迎加入！請填寫您的租屋需求',
    contents: {
      type: 'bubble',
      hero: {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
        size: 'full',
        aspectRatio: '20:13',
        aspectMode: 'cover',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🏠 優式租賃',
            weight: 'bold',
            size: 'xl',
            color: '#1a1a2e',
          },
          {
            type: 'text',
            text: '歡迎加入！我們提供台北市、新北市優質租屋物件。',
            size: 'sm',
            color: '#666666',
            wrap: true,
            margin: 'md',
          },
          {
            type: 'text',
            text: '📋 填寫您的租屋需求，我們立即為您配對最適合的物件！',
            size: 'sm',
            color: '#444444',
            wrap: true,
            margin: 'md',
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#2563eb',
            action: {
              type: 'uri',
              label: '📝 立即填寫租屋需求',
              uri: liffFormUrl,
            },
          },
        ],
      },
    },
  }
}

// 配對結果文字訊息
export function createMatchResultMessage(properties: any[]): line.TextMessage {
  if (properties.length === 0) {
    return {
      type: 'text',
      text: '😊 目前暫無完全符合您條件的物件，我們會持續為您留意！\n\n如需調整條件，歡迎重新填寫需求表單。',
    }
  }

  let text = `🎉 為您找到 ${properties.length} 個符合物件！\n${'─'.repeat(20)}\n\n`

  properties.slice(0, 5).forEach((p, i) => {
    const addressHidden = p.address.replace(/\d+號?/, 'xxx號')
    text += `📍 ${p.code}\n`
    text += `地區：${p.district}\n`
    text += `地址：${addressHidden}\n`
    text += `租金：NT$ ${Number(p.price).toLocaleString()}\n`
    text += `房型：${p.roomType}\n`
    text += `坪數：${p.area || '-'} 坪\n`
    if (i < properties.length - 1) text += '\n'
  })

  if (properties.length > 5) {
    text += `\n...還有 ${properties.length - 5} 個物件`
  }

  return { type: 'text', text }
}

// 需求確認訊息
export function createFormConfirmMessage(formData: any): line.TextMessage {
  return {
    type: 'text',
    text: `📋 需求已收到！\n${'─'.repeat(20)}\n👤 姓名：${formData.name}\n📞 電話：${formData.phone}\n🏠 區域：${formData.area}\n🛏 房型：${formData.roomType}\n💰 預算：NT$ ${Number(formData.budget).toLocaleString()} 以下\n🐾 寵物：${formData.pets}\n\n我們正在為您配對物件...`,
  }
}
