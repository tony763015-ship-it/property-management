import './globals.css'

export const metadata = {
  title: '房屋租賃物件管理系統',
  description: 'Ragic 物件整理系統',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body>
        {children}
      </body>
    </html>
  )
}
