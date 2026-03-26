'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function PropertyDetailPage() {
  const params = useParams()
  const code = params.code as string
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)

  useEffect(() => {
    if (!code) return
    fetch(`/api/property/${code}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [code])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <p style={{ color: '#9ca3af' }}>載入中...</p>
    </div>
  )

  if (!data?.property) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <p style={{ color: '#9ca3af' }}>找不到物件</p>
    </div>
  )

  const p = data.property
  const images: any[] = data.images || []
  const description: string = data.description || ''
  const coverImg = images.find((i: any) => i.isCover) || images[0]
  const gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'

  const details = [
    { label: '物件編號', value: p['編號'] },
    { label: '狀態', value: p['狀態'] },
    { label: '鄉鎮市區', value: p['鄉鎮市區'] },
    { label: '地址', value: p['地址'] ? p['地址'].replace(/\d+號?/, 'xxx號') : '' },
    { label: '格局', value: p['格局'] },
    { label: '物件型態', value: p['物件型態'] },
    { label: '樓層', value: p['所在樓層'] && p['總樓層'] ? `${p['所在樓層']} / ${p['總樓層']} 樓` : '' },
    { label: '登記坪數', value: p['登記坪數'] ? `${p['登記坪數']} 坪` : '' },
    { label: '月租金', value: p['月租金'] ? `NT$ ${Number(p['月租金']).toLocaleString()}` : '' },
    { label: '車位月租金', value: p['車位月租金'] ? `NT$ ${Number(p['車位月租金']).toLocaleString()}` : '' },
    { label: '房屋管理費', value: p['房屋管理費'] ? `NT$ ${Number(p['房屋管理費']).toLocaleString()}` : '' },
    { label: '開伙', value: p['開伙'] },
    { label: '寵物', value: p['寵物'] },
    { label: '進屋方式', value: p['進屋方式'] },
    { label: '屋齡', value: p['屋齡'] },
    { label: '委託時間(迄)', value: p['委託時間(迄)'] },
  ].filter(d => d.value)

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '2rem' }}>
      {/* 照片區 */}
      <div style={{ position: 'relative', background: '#1a1a2e', width: '100%', aspectRatio: '4/3', overflow: 'hidden' }}>
        {images.length > 0 ? (
          <>
            <img
              src={`/api/drive/image/${images[activeImg].id}`}
              alt={images[activeImg].name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {images.length > 1 && (
              <>
                {/* 左右切換 */}
                {activeImg > 0 && (
                  <button onClick={() => setActiveImg(i => i - 1)} style={arrowStyle('left')}>‹</button>
                )}
                {activeImg < images.length - 1 && (
                  <button onClick={() => setActiveImg(i => i + 1)} style={arrowStyle('right')}>›</button>
                )}
                {/* 小圓點 */}
                <div style={{ position: 'absolute', bottom: '0.75rem', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                  {images.map((_: any, i: number) => (
                    <div key={i} onClick={() => setActiveImg(i)} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === activeImg ? 'white' : 'rgba(255,255,255,0.4)', cursor: 'pointer' }} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '3rem' }}>🏠</div>
        )}
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '1rem' }}>
        {/* 標題 */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', marginBottom: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ background: gradient, color: 'white', borderRadius: '8px', padding: '0.2rem 0.6rem', fontSize: '0.8rem', fontWeight: '700' }}>{p['編號']}</span>
            <span style={{ fontSize: '1.3rem', fontWeight: '800', color: '#667eea' }}>NT$ {Number(p['月租金']).toLocaleString()}</span>
          </div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1a1a2e', margin: '0 0 0.25rem' }}>{p['案名'] || p['鄉鎮市區']}</h1>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: 0 }}>📍 {p['鄉鎮市區']} · {p['格局']}</p>
        </div>

        {/* 詳細資訊 */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', marginBottom: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#374151', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>📋 物件資訊</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {details.map(d => (
              <div key={d.label}>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: '0.1rem' }}>{d.label}</div>
                <div style={{ fontSize: '0.88rem', color: '#374151', fontWeight: '600' }}>{d.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 物件介紹 */}
        {description && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#374151', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>📝 物件介紹</h2>
            <p style={{ fontSize: '0.88rem', color: '#4b5563', lineHeight: '1.8', margin: 0, whiteSpace: 'pre-wrap' }}>{description}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function arrowStyle(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute',
    top: '50%',
    [side]: '0.75rem',
    transform: 'translateY(-50%)',
    background: 'rgba(0,0,0,0.4)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    fontSize: '1.4rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  }
}
