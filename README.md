# 房屋租賃物件管理系統

## ✅ 完成情況

系統已完全開發完成，包含以下功能：

### 1️⃣ **上傳整理** (`/upload`)
- 上傳 Ragic 匯出的 Excel 檔
- 自動套用編碼規則
- 自動寫入 Google Sheet
- 防止重複匯入

### 2️⃣ **物件管理** (`/properties`)
- 查看所有物件列表
- 標記物件為「已出租」或「在租」
- 篩選查看不同狀態的物件

### 3️⃣ **房客配對** (`/match`)
- 選擇城市、行政區、房型、預算
- 自動查詢符合條件的物件
- 篩選結果顯示詳細資訊

### 4️⃣ **自動編碼**
編碼規則：`AA2001`
- 第 1-2 碼：地區代碼（A=台北市, B=新北市...）
- 第 3 碼：房型（1=套房, 2=2房...）
- 第 4-6 碼：序號（001 起始）

---

## 🚀 快速開始

### 本地開發
```bash
cd property-management
npm run dev
```
訪問 http://localhost:3000

### 部署到 Vercel（推薦）
1. 推送到 GitHub
2. 連接 Vercel：https://vercel.com
3. 選擇 `property-management` 資料夾
4. 設定環境變數：
   - `NEXT_PUBLIC_SHEET_ID` = 你的 Google Sheet ID

---

## 📋 設定 Google Sheet

### Step 1: 準備 Google Sheet
1. 建立新的 Google Sheet（或使用現有的）
2. 複製 Sheet ID（URL 中的長字串）

### Step 2: 建立 Service Account（一次性）
1. 到 Google Cloud Console：https://console.cloud.google.com
2. 建立新專案
3. 啟用 Google Sheets API
4. 建立 Service Account
5. 下載 JSON 金鑰（放在專案根目錄）
6. 將 Service Account email 加入 Google Sheet 的編輯者

### Step 3: 設定 Sheet 分頁
系統會自動建立這些分頁（首次上傳時）：

| 分頁名稱 | 用途 |
|---------|------|
| 物件總表 | 主要物件資料 |
| 地區編碼對照 | 城市/行政區映射表 |
| 序號記錄 | 序號計數器 |

---

## 📁 專案結構

```
property-management/
├── app/
│   ├── page.tsx                 # 首頁
│   ├── upload/page.tsx          # 上傳頁面
│   ├── properties/page.tsx      # 物件管理頁
│   ├── match/page.tsx           # 配對查詢頁
│   ├── api/
│   │   ├── upload/route.ts      # 上傳 API
│   │   ├── properties/route.ts  # 取得物件 API
│   │   ├── properties/[code]/route.ts  # 更新物件 API
│   │   └── match/route.ts       # 配對查詢 API
│   ├── layout.tsx               # 全局佈局
│   └── globals.css              # 全局樣式
├── lib/
│   ├── google-sheets.ts         # Google Sheets API 封裝
│   ├── excel-parser.ts          # Excel 解析器
│   └── code-generator.ts        # 編碼生成引擎
├── .env.local                   # 環境變數
├── mapserch-483507-71e31311e1cf.json  # Service Account 金鑰
└── README.md                    # 說明文件
```

---

## 🔄 工作流程示例

### 1️⃣ 上傳物件
```
匯出 Ragic Excel
  → 上傳到系統
  → 自動生成編碼 (AA2001, AA2002...)
  → 寫入 Google Sheet
  → ✅ 完成
```

### 2️⃣ 管理物件
```
系統讀取 Google Sheet
  → 顯示所有物件列表
  → 點擊「標記出租」
  → 更新狀態為「已出租」
  → ✅ 已隱藏該物件
```

### 3️⃣ 房客配對
```
房客詢問條件（如：台北市、2房、預算 25000）
  → 系統篩選 Google Sheet
  → 回傳符合條件的物件清單
  → ✅ 可直接回覆房客
```

---

## 🛠️ 技術棧

- **前端**：Next.js 16、React 19、Tailwind CSS 4
- **後端**：Next.js API Routes
- **資料庫**：Google Sheets API
- **部署**：Vercel（支援全球加速）

---

## 📱 使用建議

1. **第一次使用**：先上傳一個小的 Excel 檔測試系統
2. **定期備份**：Google Sheet 已自動版本控制
3. **多人協作**：邀請同事編輯 Google Sheet，系統會即時讀取
4. **手機使用**：Google Sheet 可在手機上查看和編輯

---

## 💡 常見問題

### Q: 編碼規則會自動更新嗎？
A: 是的，每次上傳新物件時，系統會自動生成正確的編碼並記錄。

### Q: 多人同時上傳會出現重複編碼嗎？
A: 不會，系統在 Google Sheet 記錄序號，確保編碼唯一。

### Q: 可以刪除或修改已上傳的物件嗎？
A: 可以，直接在 Google Sheet 編輯或刪除即可，系統會即時讀取。

### Q: 支援多少個物件？
A: Google Sheet 支援百萬行，系統性能不受限制。

---

## 📞 支援

遇到問題？檢查：
1. `.env.local` 中的 Sheet ID 是否正確
2. Service Account 是否有 Google Sheet 編輯權限
3. Google Cloud Console 中 Google Sheets API 是否啟用

---

**最後更新**：2026-03-25
