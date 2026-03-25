export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <nav className="bg-blue-600 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">房屋租賃管理系統</h1>
          <ul className="flex gap-6">
            <li><a href="/" className="hover:text-blue-200">首頁</a></li>
            <li><a href="/upload" className="hover:text-blue-200">上傳物件</a></li>
            <li><a href="/properties" className="hover:text-blue-200">物件管理</a></li>
            <li><a href="/match" className="hover:text-blue-200">配對查詢</a></li>
          </ul>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </>
  )
}
