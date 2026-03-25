# 部署指南（Vercel）

## 5 分鐘快速部署

### Step 1: 推送到 GitHub
```bash
cd property-management
git init
git add .
git commit -m "Initial commit: Property management system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/property-management.git
git push -u origin main
```

### Step 2: 連接 Vercel
1. 訪問 https://vercel.com
2. 用 GitHub 帳號登入
3. 點擊 "Import Project"
4. 選擇 `property-management` 資料夾
5. 在 "Root Directory" 選擇 `property-management`

### Step 3: 設定環境變數
在 Vercel 部署設定中，新增：

**環境變數：**
| Key | Value |
|-----|-------|
| NEXT_PUBLIC_SHEET_ID | 1FGgR1P2RRYlVwNp63QvQqAVmmJ0Sl7tYbv8Rn6NZC6s |

**Service Account 金鑰（上傳檔案）：**
1. 在 Vercel 項目設定中，找到 "Files"
2. 上傳 `mapserch-483507-71e31311e1cf.json`

或者放在專案根目錄，Vercel 會自動部署。

### Step 4: Deploy！
點擊 "Deploy"，等待 2-3 分鐘...

✅ 完成！你會得到一個公開連結，如：
```
https://property-management-xyz.vercel.app
```

---

## 同事如何使用

1. **分享連結**：把 Vercel 連結傳給同事
2. **無需安裝**：直接在瀏覽器打開
3. **所有人用同一個 Google Sheet**：自動同步

---

## 更新系統

有新功能或修復？

```bash
# 做出修改
git add .
git commit -m "修復或新增功能"
git push

# Vercel 自動部署！✅
```

---

## 常見部署問題

### ❌ "Permission denied" 上傳文件
→ 檢查 GitHub 是否連接，試著重新授權

### ❌ "Cannot find Service Account key"
→ 確認 `mapserch-483507-71e31311e1cf.json` 在專案根目錄
→ 或上傳到 Vercel 的環境變數設定

### ❌ "Google Sheet API 錯誤"
→ 檢查 Sheet ID 是否正確（NEXT_PUBLIC_SHEET_ID）
→ 確認 Service Account email 已加入 Google Sheet 編輯者

---

**需要幫助？** 檢查 Vercel Logs：https://vercel.com/dashboard → 選擇專案 → Logs 標籤
