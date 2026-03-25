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
    // 初始化 LIFF 取得用戶 ID
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
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 text-center shadow-lg max-w-sm w-full">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">需求已送出！</h2>
        <p className="text-gray-500 text-sm">我們正在為您配對物件，請稍候查看 LINE 訊息。</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold">🏠 填寫租屋需求</h1>
        <div className="flex gap-1 mt-2">
          {[1,2,3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full ${step >= s ? 'bg-white' : 'bg-blue-400'}`} />
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">

        {step === 1 && (
          <>
            <h2 className="font-bold text-gray-700">👤 申請人資料</h2>
            <Input label="姓名 *" value={form.name} onChange={v => set('name', v)} />
            <Input label="電話 *" value={form.phone} onChange={v => set('phone', v)} type="tel" />
            <Select label="性別" value={form.gender} onChange={v => set('gender', v)}
              options={['男', '女', '不透露']} />
            <Input label="入住人數 *" value={form.residents} onChange={v => set('residents', v)} type="number" />
            <Select label="同住人關係" value={form.relationship} onChange={v => set('relationship', v)}
              options={['單獨', '夫妻/伴侶', '家人', '室友', '其他']} />
            <Input label="居住人年齡 *" value={form.age} onChange={v => set('age', v)} />
            <Select label="居住人職業" value={form.occupation} onChange={v => set('occupation', v)}
              options={['上班族', '學生', '自營業', '退休', '其他']} />
            <Input label="公司/學校" value={form.company} onChange={v => set('company', v)} />
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-bold text-gray-700">🏠 租屋條件</h2>
            <Input label="找房區域 *（例如：三重區、板橋區）" value={form.area} onChange={v => set('area', v)} />
            <Select label="房型需求 *" value={form.roomType} onChange={v => set('roomType', v)}
              options={['套房', '2房', '3房', '4房', '廠房', '商辦', '店面']} />
            <Select label="物件型態" value={form.propertyType} onChange={v => set('propertyType', v)}
              options={['公寓', '電梯大樓', '華廈', '透天', '不限']} />
            <Select label="汽機車位" value={form.parking} onChange={v => set('parking', v)}
              options={['不需要', '汽車位', '機車位', '汽機車位']} />
            <Input label="預算上限 *（元）" value={form.budget} onChange={v => set('budget', v)} type="number" />
            <Select label="是否抽菸" value={form.smoking} onChange={v => set('smoking', v)}
              options={['沒有', '有', '電子菸']} />
            <Select label="是否有寵物" value={form.pets} onChange={v => set('pets', v)}
              options={['沒有', '貓', '狗', '其他']} />
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="font-bold text-gray-700">📋 其他需求</h2>
            <Select label="是否需要租屋補助" value={form.subsidy} onChange={v => set('subsidy', v)}
              options={['不需要', '需要']} />
            <Select label="是否需入戶籍" value={form.registration} onChange={v => set('registration', v)}
              options={['不需要', '需要']} />
            <Select label="家具需求" value={form.furniture} onChange={v => set('furniture', v)}
              options={['全部家具', '局部家具', '不需要家具']} />
            <Input label="原租約到期日" value={form.leaseEnd} onChange={v => set('leaseEnd', v)} type="date" />
            <Input label="預計起租日" value={form.moveIn} onChange={v => set('moveIn', v)} type="date" />
            <Select label="喜歡是否可立即決定" value={form.decision} onChange={v => set('decision', v)}
              options={['可以', '需討論', '無法']} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">特殊需求</label>
              <textarea
                className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={form.special}
                onChange={e => set('special', e.target.value)}
                placeholder="請輸入任何特殊需求..."
              />
            </div>
          </>
        )}
      </div>

      {/* Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-3 max-w-lg mx-auto">
        {step > 1 && (
          <button onClick={() => setStep(s => s - 1)}
            className="flex-1 border border-gray-300 text-gray-700 rounded-xl py-3 font-medium">
            上一步
          </button>
        )}
        {step < 3 ? (
          <button onClick={() => setStep(s => s + 1)}
            className="flex-1 bg-blue-600 text-white rounded-xl py-3 font-medium">
            下一步
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 bg-blue-600 text-white rounded-xl py-3 font-medium disabled:opacity-50">
            {loading ? '送出中...' : '✅ 送出需求'}
          </button>
        )}
      </div>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text' }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

function Select({ label, value, onChange, options }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="">請選擇...</option>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
