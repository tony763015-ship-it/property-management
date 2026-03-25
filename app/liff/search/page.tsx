'use client'

import { useState } from 'react'

const DISTRICTS: Record<string, string[]> = {
  '臺北市': ['不限', '中正區', '大同區', '中山區', '松山區', '大安區', '萬華區', '信義區', '士林區', '北投區', '內湖區', '南港區', '文山區'],
  '新北市': ['不限', '板橋區', '三重區', '中和區', '永和區', '新莊區', '新店區', '樹林區', '鶯歌區', '三峽區', '淡水區', '汐止區', '瑞芳區', '土城區', '蘆洲區', '五股區', '泰山區', '林口區'],
}

const ROOM_TYPES = ['不限', '套房', '2房', '3房', '4房', '廠房', '商辦', '店面']
const PET_OPTIONS = ['不限', '可寵', '可貓', '可狗']

export default function LiffSearchPage() {
  const [city, setCity] = useState('臺北市')
  const [district, setDistrict] = useState('不限')
  const [roomType, setRoomType] = useState('不限')
  const [budget, setBudget] = useState('')
  const [pets, setPets] = useState('不限')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[] | null>(null)

  const handleSearch = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/line/quick-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city,
          district: district === '不限' ? '' : district,
          roomType: roomType === '不限' ? '' : roomType,
          budget,
          pets: pets === '不限' ? '不限' : pets,
        }),
      })
      const data = await res.json()
      setResults(data.matched || [])
    } catch {
      alert('搜尋失敗，請再試一次')
    }
    setLoading(false)
  }

  const gradientBg = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <div style={{ background: gradientBg, padding: '1.25rem 1rem 1.5rem' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>🔍 優式租賃 · 快速找房</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', margin: '0.3rem 0 0' }}>輸入條件，立即查看符合物件</p>
        </div>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '1.25rem 1rem' }}>
        {/* Search Form */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', marginBottom: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#374151', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>🏠 搜尋條件</h2>

          {/* 縣市 */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>縣市</label>
            <select value={city} onChange={e => { setCity(e.target.value); setDistrict('不限') }} style={selectStyle}>
              {Object.keys(DISTRICTS).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* 鄉鎮市區 */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>鄉鎮市區</label>
            <select value={district} onChange={e => setDistrict(e.target.value)} style={selectStyle}>
              {DISTRICTS[city].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* 房型 */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>房型</label>
            <select value={roomType} onChange={e => setRoomType(e.target.value)} style={selectStyle}>
              {ROOM_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* 預算上限 */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>預算上限（元）</label>
            <input
              type="number"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              placeholder="例：25000（不填表示不限）"
              style={inputStyle}
            />
          </div>

          {/* 寵物 */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>寵物</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {PET_OPTIONS.map(p => (
                <button
                  key={p}
                  onClick={() => setPets(p)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '99px',
                    border: pets === p ? 'none' : '1.5px solid #e5e7eb',
                    background: pets === p ? gradientBg : 'white',
                    color: pets === p ? 'white' : '#6b7280',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading}
            style={{ width: '100%', background: gradientBg, color: 'white', border: 'none', borderRadius: '12px', padding: '0.85rem', fontSize: '1rem', fontWeight: '700', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? '搜尋中...' : '🔍 立即搜尋'}
          </button>
        </div>

        {/* Results */}
        {results !== null && (
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#374151', marginBottom: '0.75rem' }}>
              {results.length > 0 ? `找到 ${results.length} 個符合物件` : '目前無符合條件的物件'}
            </h3>

            {results.length === 0 && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>😊</div>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: '1.6' }}>目前暫無完全符合的物件<br />可以調整條件再試試</p>
              </div>
            )}

            {results.map((p, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', marginBottom: '0.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ background: gradientBg, color: 'white', borderRadius: '8px', padding: '0.2rem 0.6rem', fontSize: '0.8rem', fontWeight: '700' }}>{p.code}</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#667eea' }}>NT$ {Number(p.price).toLocaleString()}</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '0.35rem' }}>📍 {p.district}｜{p.address}</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {p.roomType && <Tag>{p.roomType}</Tag>}
                  {p.area && <Tag>{p.area} 坪</Tag>}
                  {p.floor && p.totalFloor && <Tag>{p.floor}/{p.totalFloor} 樓</Tag>}
                  {p.type && <Tag>{p.type}</Tag>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: '#f3f4f6', color: '#6b7280', borderRadius: '6px', padding: '0.2rem 0.5rem', fontSize: '0.78rem' }}>
      {children}
    </span>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.35rem' }
const inputStyle: React.CSSProperties = { width: '100%', border: '1.5px solid #e5e7eb', borderRadius: '10px', padding: '0.65rem 0.75rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', background: '#fafafa' }
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }
