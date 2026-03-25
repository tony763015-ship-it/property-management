'use client'

import { useState } from 'react'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setError('')
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('請選擇 Excel 檔案')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const data = await response.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message || '上傳失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold mb-4">上傳 Ragic 物件資料</h2>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <div className="text-6xl mb-4">📁</div>
              <p className="text-gray-600">
                {file ? file.name : '點擊選擇 Excel 檔案或拖放檔案'}
              </p>
              <p className="text-sm text-gray-400 mt-2">支援 .xlsx 和 .xls 格式</p>
            </label>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg"
          >
            {loading ? '處理中...' : '開始上傳整理'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          ❌ {error}
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 space-y-4">
          <h3 className="text-xl font-bold text-green-900">✅ 上傳成功</h3>
          <div className="space-y-2 text-green-700">
            <p>📊 處理物件數: <strong>{result.processedCount}</strong></p>
            <p>✨ 新增物件: <strong>{result.newCount}</strong></p>
            <p>📋 重複物件: <strong>{result.duplicateCount}</strong></p>
            <p>⚠️ 有誤物件: <strong>{result.errorCount}</strong></p>
          </div>
          {result.errors && result.errors.length > 0 && (
            <div className="mt-4 bg-yellow-50 p-4 rounded">
              <p className="font-bold text-yellow-900 mb-2">警告:</p>
              <ul className="text-sm text-yellow-700 space-y-1">
                {result.errors.map((err: string, i: number) => (
                  <li key={i}>• {err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
