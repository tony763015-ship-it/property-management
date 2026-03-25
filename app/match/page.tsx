'use client'

import { useState } from 'react'

interface MatchResult {
  code: string
  city: string
  district: string
  address: string
  roomType: string
  price: number
  area?: number
  floor?: string
  phone?: string
}

const CITIES = ['台北市', '新北市', '台中市', '台南市', '高雄市', '桃園市']
const DISTRICTS: { [key: string]: string[] } = {
  '台北市': ['中正', '大同', '中山', '松山', '大安', '信義', '南港', '內湖', '士林', '北投', '萬華', '文山'],
  '新北市': ['板橋', '新莊', '中和', '永和', '土城', '三峽', '蘆洲', '五股', '新店', '汐止', '樹林', '鶯歌', '三重', '淡水', '八里', '深坑', '石碇', '坪林', '烏來', '平溪', '雙溪', '貢寮', '金山', '萬里', '林口', '泰山'],
}

const ROOM_TYPES = ['套房', '2房', '3房', '4房', '5房以上']

export default function MatchPage() {
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([])
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>([])
  const [maxPrice, setMaxPrice] = useState('')
  const [results, setResults] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const availableDistricts = selectedCities.length > 0
    ? selectedCities.flatMap(c => DISTRICTS[c] || [])
    : []

  const handleCityToggle = (city: string) => {
    setSelectedCities(prev =>
      prev.includes(city)
        ? prev.filter(c => c !== city)
        : [...prev, city]
    )
    // Reset districts when city changes
    setSelectedDistricts([])
  }

  const handleDistrictToggle = (district: string) => {
    setSelectedDistricts(prev =>
      prev.includes(district)
        ? prev.filter(d => d !== district)
        : [...prev, district]
    )
  }

  const handleRoomTypeToggle = (type: string) => {
    setSelectedRoomTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const handleSearch = async () => {
    if (selectedCities.length === 0) {
      alert('請至少選擇一個城市')
      return
    }

    setLoading(true)
    setSearched(true)

    try {
      const params = new URLSearchParams()
      selectedCities.forEach(c => params.append('cities', c))
      selectedDistricts.forEach(d => params.append('districts', d))
      selectedRoomTypes.forEach(t => params.append('roomTypes', t))
      if (maxPrice) params.append('maxPrice', maxPrice)

      const response = await fetch(`/api/match?${params.toString()}`)
      if (!response.ok) throw new Error('查詢失敗')
      const data = await response.json()
      setResults(data)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold mb-6">房客需求配對</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Filters */}
          <div className="space-y-6">
            {/* Cities */}
            <div>
              <h3 className="font-bold mb-3">選擇城市</h3>
              <div className="space-y-2">
                {CITIES.map(city => (
                  <label key={city} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedCities.includes(city)}
                      onChange={() => handleCityToggle(city)}
                      className="mr-3"
                    />
                    {city}
                  </label>
                ))}
              </div>
            </div>

            {/* Districts */}
            {availableDistricts.length > 0 && (
              <div>
                <h3 className="font-bold mb-3">選擇行政區（選填）</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableDistricts.map(district => (
                    <label key={district} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedDistricts.includes(district)}
                        onChange={() => handleDistrictToggle(district)}
                        className="mr-3"
                      />
                      {district}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Room Types */}
            <div>
              <h3 className="font-bold mb-3">房型偏好（選填）</h3>
              <div className="space-y-2">
                {ROOM_TYPES.map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedRoomTypes.includes(type)}
                      onChange={() => handleRoomTypeToggle(type)}
                      className="mr-3"
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            {/* Max Price */}
            <div>
              <label className="block font-bold mb-2">最高月租（選填）</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="例如 30000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="flex-1 border rounded px-3 py-2"
                />
                <span>元</span>
              </div>
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg"
            >
              {loading ? '搜尋中...' : '🔍 開始配對'}
            </button>
          </div>

          {/* Right: Summary */}
          <div className="bg-gray-50 rounded-lg p-6 h-fit">
            <h3 className="font-bold mb-4">篩選條件摘要</h3>
            <div className="space-y-3 text-sm">
              <div>
                <strong>城市：</strong>
                {selectedCities.length > 0 ? selectedCities.join('、') : '未選擇'}
              </div>
              <div>
                <strong>行政區：</strong>
                {selectedDistricts.length > 0 ? selectedDistricts.join('、') : '全部'}
              </div>
              <div>
                <strong>房型：</strong>
                {selectedRoomTypes.length > 0 ? selectedRoomTypes.join('、') : '全部'}
              </div>
              <div>
                <strong>租金上限：</strong>
                {maxPrice ? `NT$${parseInt(maxPrice).toLocaleString()}` : '無限制'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div className="bg-white rounded-lg shadow p-8">
          <h3 className="text-xl font-bold mb-4">
            查詢結果：找到 <span className="text-purple-600">{results.length}</span> 筆物件
          </h3>

          {results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold">編碼</th>
                    <th className="px-4 py-3 text-left font-bold">地區</th>
                    <th className="px-4 py-3 text-left font-bold">地址</th>
                    <th className="px-4 py-3 text-left font-bold">房型</th>
                    <th className="px-4 py-3 text-left font-bold">坪數</th>
                    <th className="px-4 py-3 text-left font-bold">月租</th>
                    <th className="px-4 py-3 text-left font-bold">聯絡</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((prop) => (
                    <tr key={prop.code} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-bold text-purple-600">{prop.code}</td>
                      <td className="px-4 py-3 text-sm">{prop.city} {prop.district}</td>
                      <td className="px-4 py-3 text-sm">{prop.address}</td>
                      <td className="px-4 py-3">{prop.roomType}</td>
                      <td className="px-4 py-3">{prop.area ? `${prop.area}坪` : '-'}</td>
                      <td className="px-4 py-3 font-bold text-green-600">NT${prop.price.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-blue-600">{prop.phone || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              沒有符合條件的物件
            </div>
          )}
        </div>
      )}
    </div>
  )
}
