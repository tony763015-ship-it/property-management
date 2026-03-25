'use client'

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="bg-white rounded-lg shadow p-8">
        <h2 className="text-3xl font-bold mb-4">歡迎使用房屋租賃物件管理系統</h2>
        <p className="text-gray-600 mb-6">
          此系統協助房仲業務快速整理 Ragic 匯出的物件資料，自動套用編碼規則，並提供房客需求配對功能。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
            <h3 className="font-bold text-blue-900 mb-2">1. 上傳物件</h3>
            <p className="text-blue-700">
              上傳 Ragic 匯出的 Excel 檔，系統自動解析並套用編碼規則。
            </p>
            <a href="/upload" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
              → 前往上傳
            </a>
          </div>

          <div className="bg-green-50 border-l-4 border-green-600 p-4">
            <h3 className="font-bold text-green-900 mb-2">2. 管理物件</h3>
            <p className="text-green-700">
              查看所有物件，標記已出租，管理物件上下架。
            </p>
            <a href="/properties" className="text-green-600 hover:text-green-800 mt-2 inline-block">
              → 前往管理
            </a>
          </div>

          <div className="bg-purple-50 border-l-4 border-purple-600 p-4">
            <h3 className="font-bold text-purple-900 mb-2">3. 配對查詢</h3>
            <p className="text-purple-700">
              輸入房客需求條件，自動篩選符合的物件。
            </p>
            <a href="/match" className="text-purple-600 hover:text-purple-800 mt-2 inline-block">
              → 前往查詢
            </a>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow p-8">
        <h3 className="text-xl font-bold mb-4">編碼規則說明</h3>
        <div className="bg-gray-50 p-4 rounded font-mono text-sm space-y-2">
          <p><strong>編碼格式：</strong> AA2001</p>
          <p><strong>第 1-2 碼：</strong> 地區代碼（城市 + 行政區）</p>
          <p className="ml-4">• 台北市：AA, AB, AC...</p>
          <p className="ml-4">• 新北市：BA, BB, BC...</p>
          <p><strong>第 3 碼：</strong> 房型代碼（1=套房、2=2房、3=3房...）</p>
          <p><strong>第 4-6 碼：</strong> 序號（同地區同房型從 001 開始）</p>
        </div>
      </section>
    </div>
  )
}
