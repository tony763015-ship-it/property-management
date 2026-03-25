'use client'

import { useState, useEffect } from 'react'

export default function LiffFormPage() {
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lineUserId, setLineUserId] = useState('')
  const [form, setForm] = useState({
    name: '', phone: '', gender: '',
    residents: '', relationship: '', age: '', occupation: '', company: '',
    area: '', roomType: '', propertyType: '', parking: '',
    budget: '', smoking: '', pets: '', subsidy: '',
    registration: '', furniture: '', leaseEnd: '', moveIn: '',
    special: '', decision: '',
  })

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }))

  useEffect(() => {
    const initLiff = async () => {
      try {
        const liff = (await import('@line/liff')).default
        await liff.init({ liffId: '2009603225-fx2PTwfJ' })
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile()
          setLineUserId(profile.userId)
        } else {
          liff.login()
        }
      } catch (e) {
        console.log('LIFF init error:', e)
      }
    }
    initLiff()
  }, [])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/line/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-line-user-id': lineUserId,
        },
        body: JSON.stringify(form),
      })
      if (res.ok) setSubmitted(true)
    } catch (e) {
      alert('送出失敗，請再試一次')
    }
    setLoading(false)
  }

  if (submitted) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: '24px', padding: '2.5rem', textAlign: 'center', maxWidth: '360px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '0.5rem' }}>需求已送出！</h2>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: '1.6' }}>
          我們正在為您配對最適合的物件<br />請稍候查看 LINE 訊息 💬
        </p>
      </div>
    </div>
  )

  const steps = ['申請人資料', '租屋條件', '其他需求']

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '90px' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '1.25rem 1rem 1.5rem' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>🏠 優式租賃 · 租屋需求</h1>
          {/* Progress */}
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              {steps.map((s, i) => (
                <span key={i} style={{ fontSize: '0.7rem', color: step > i ? 'white' : 'rgba(255,255,255,0.5)', fontWeight: step === i + 1 ? '700' : '400' }}>
                  {i + 1}. {s}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {steps.map((_, i) => (
                <div key={i} style={{ height: '4px', flex: 1, borderRadius: '99px', background: step > i ? 'white' : 'rgba(255,255,255,0.3)', transition: 'background 0.3s' }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '1.25rem 1rem' }}>

        {step === 1 && (
          <Card title="👤 申請人資料">
            <Input label="姓名" required value={form.name} onChange={v => set('name', v)} />
            <Input label="電話" required value={form.phone} onChange={v => set('phone', v)} type="tel" />
            <Select label="性別" value={form.gender} onChange={v => set('gender', v)} options={['男', '女', '不透露']} />
            <Input label="入住人數" required value={form.residents} onChange={v => set('residents', v)} type="number" placeholder="例：2" />
            <Select label="同住人關係" value={form.relationship} onChange={v => set('relationship', v)} options={['單獨', '夫妻/伴侶', '家人', '室友', '其他']} />
            <Input label="居住人年齡" required value={form.age} onChange={v => set('age', v)} placeholder="例：28" />
            <Input label="居住人職業" value={form.occupation} onChange={v => set('occupation', v)} placeholder="例：上班族、學生" />
            <Input label="公司/學校" value={form.company} onChange={v => set('company', v)} placeholder="選填" />
          </Card>
        )}

        {step === 2 && (
          <Card title="🏠 租屋條件">
            <Input label="找房區域" required value={form.area} onChange={v => set('area', v)} placeholder="例：三重區、板橋區" />
            <Select label="房型需求" required value={form.roomType} onChange={v => set('roomType', v)} options={['套房', '2房', '3房', '4房', '廠房', '商辦', '店面']} />
            <Select label="物件型態" value={form.propertyType} onChange={v => set('propertyType', v)} options={['公寓', '電梯大樓', '華廈', '透天', '不限']} />
            <Select label="車位需求" value={form.parking} onChange={v => set('parking', v)} options={['不需要', '汽車位', '機車位', '汽機車位']} />
            <Input label="預算上限（元）" required value={form.budget} onChange={v => set('budget', v)} type="number" placeholder="例：25000" />
            <Select label="是否抽菸" value={form.smoking} onChange={v => set('smoking', v)} options={['沒有', '有', '電子菸']} />
            <Select label="是否有寵物" value={form.pets} onChange={v => set('pets', v)} options={['沒有', '貓', '狗', '其他']} />
          </Card>
        )}

        {step === 3 && (
          <Card title="📋 其他需求">
            <Select label="是否需要租屋補助" value={form.subsidy} onChange={v => set('subsidy', v)} options={['不需要', '需要']} />
            <Select label="是否需入戶籍" value={form.registration} onChange={v => set('registration', v)} options={['不需要', '需要']} />
            <Select label="家具需求" value={form.furniture} onChange={v => set('furniture', v)} options={['全部家具', '局部家具', '不需要家具']} />
            <Input label="原租約到期日" value={form.leaseEnd} onChange={v => set('leaseEnd', v)} type="date" />
            <Input label="預計起租日" value={form.moveIn} onChange={v => set('moveIn', v)} type="date" />
            <Select label="喜歡是否可立即決定" value={form.decision} onChange={v => set('decision', v)} options={['可以', '需討論', '無法']} />
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>特殊需求</label>
              <textarea
                style={{ ...inputStyle, height: '80px', resize: 'none' }}
                value={form.special}
                onChange={e => set('special', e.target.value)}
                placeholder="請輸入任何特殊需求（選填）"
              />
            </div>
          </Card>
        )}
      </div>

      {/* Bottom Buttons */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #e5e7eb', padding: '0.75rem 1rem', display: 'flex', gap: '0.75rem', maxWidth: '480px', margin: '0 auto' }}>
        {step > 1 && (
          <button onClick={() => setStep(s => s - 1)} style={backBtnStyle}>
            ← 上一步
          </button>
        )}
        {step < 3 ? (
          <button onClick={() => setStep(s => s + 1)} style={nextBtnStyle}>
            下一步 →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading} style={{ ...nextBtnStyle, opacity: loading ? 0.6 : 1 }}>
            {loading ? '送出中...' : '✅ 送出需求'}
          </button>
        )}
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', marginBottom: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#374151', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>{title}</h2>
      {children}
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.35rem' }
const inputStyle: React.CSSProperties = { width: '100%', border: '1.5px solid #e5e7eb', borderRadius: '10px', padding: '0.65rem 0.75rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', background: '#fafafa' }
const nextBtnStyle: React.CSSProperties = { flex: 1, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '12px', padding: '0.85rem', fontSize: '1rem', fontWeight: '700', cursor: 'pointer' }
const backBtnStyle: React.CSSProperties = { flex: 1, background: 'white', color: '#6b7280', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '0.85rem', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }

function Input({ label, value, onChange, type = 'text', placeholder = '', required = false }: any) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={labelStyle}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  )
}

function Select({ label, value, onChange, options, required = false }: any) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={labelStyle}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
        <option value="">請選擇...</option>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
