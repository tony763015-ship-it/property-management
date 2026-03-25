'use client'

import { useEffect, useState } from 'react'

interface Property {
  code: string
  city: string
  district: string
  address: string
  roomType: string
  price: number
  status: string
  area?: number
  floor?: string
  phone?: string
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all, available, rented

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties')
      if (!response.ok) throw new Error('取得物件失敗')
      const data = await response.json()
      setProperties(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (code: string, newStatus: string) => {
    try {
      await fetch(`/api/properties/${code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      // Refresh list
      fetchProperties()
    } catch (err) {
      alert('更新失敗')
    }
  }

  const filteredProperties = properties.filter(p => {
    if (filter === 'available') return p.status === '在租'
    if (filter === 'rented') return p.status === '已出租'
    return true
  })

  if (loading) return <div className="text-center py-8">載入中...</div>
  if (error) return <div className="bg-red-50 p-4 text-red-700 rounded">{error}</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">物件管理</h2>
        <div className="space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            全部 ({properties.length})
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`px-4 py-2 rounded ${filter === 'available' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
          >
            在租 ({properties.filter(p => p.status === '在租').length})
          </button>
          <button
            onClick={() => setFilter('rented')}
            className={`px-4 py-2 rounded ${filter === 'rented' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
          >
            已出租 ({properties.filter(p => p.status === '已出租').length})
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left font-bold">編碼</th>
              <th className="px-6 py-3 text-left font-bold">地區</th>
              <th className="px-6 py-3 text-left font-bold">地址</th>
              <th className="px-6 py-3 text-left font-bold">房型</th>
              <th className="px-6 py-3 text-left font-bold">租金</th>
              <th className="px-6 py-3 text-left font-bold">狀態</th>
              <th className="px-6 py-3 text-left font-bold">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredProperties.map((prop) => (
              <tr key={prop.code} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3 font-mono font-bold text-blue-600">{prop.code}</td>
                <td className="px-6 py-3">{prop.city} {prop.district}</td>
                <td className="px-6 py-3 text-sm">{prop.address}</td>
                <td className="px-6 py-3">{prop.roomType}</td>
                <td className="px-6 py-3 font-bold">NT${prop.price.toLocaleString()}</td>
                <td className="px-6 py-3">
                  <span className={`px-3 py-1 rounded text-sm font-bold ${
                    prop.status === '在租' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {prop.status}
                  </span>
                </td>
                <td className="px-6 py-3">
                  {prop.status === '在租' ? (
                    <button
                      onClick={() => handleStatusChange(prop.code, '已出租')}
                      className="text-red-600 hover:text-red-800 font-bold"
                    >
                      標記出租
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(prop.code, '在租')}
                      className="text-green-600 hover:text-green-800 font-bold"
                    >
                      恢復在租
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredProperties.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          沒有符合條件的物件
        </div>
      )}
    </div>
  )
}
