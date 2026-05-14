'use client'

import { useEffect, useState } from 'react'
import { Code2, RefreshCw, Pencil, X, Check } from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'

interface DSAProfile {
  userId: number
  lcUsername: string | null
  cfHandle: string | null
  ccUsername: string | null
  csesUsername: string | null
  dailyTarget: number
  targetCfRating: number | null
}

export default function DSAPage() {
  const [profile, setProfile] = useState<DSAProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fetchMsg, setFetchMsg] = useState('')
  const [fetching, setFetching] = useState(false)
  const [form, setForm] = useState({
    lcUsername: '', cfHandle: '', ccUsername: '', csesUsername: '',
    dailyTarget: 5, targetCfRating: '',
  })

  useEffect(() => {
    fetch('/api/dsa/profile')
      .then(r => r.json())
      .then((data: DSAProfile) => {
        setProfile(data)
        setForm({
          lcUsername: data.lcUsername ?? '',
          cfHandle: data.cfHandle ?? '',
          ccUsername: data.ccUsername ?? '',
          csesUsername: data.csesUsername ?? '',
          dailyTarget: data.dailyTarget,
          targetCfRating: data.targetCfRating ? String(data.targetCfRating) : '',
        })
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/dsa/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lcUsername: form.lcUsername || null,
        cfHandle: form.cfHandle || null,
        ccUsername: form.ccUsername || null,
        csesUsername: form.csesUsername || null,
        dailyTarget: form.dailyTarget,
        targetCfRating: form.targetCfRating ? parseInt(form.targetCfRating) : null,
      }),
    })
    if (res.ok) {
      const updated = await res.json()
      setProfile(updated)
      setEditing(false)
    }
    setSaving(false)
  }

  async function triggerFetch() {
    setFetching(true)
    setFetchMsg('')
    const res = await fetch('/api/dsa/fetch-now', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) {
      setFetchMsg(data.error ?? 'Fetch failed')
    } else {
      const parts = (data.platforms ?? []).map((p: { platform: string; status: string; totalSolved?: number; problemsSolvedToday?: number; error?: string }) => {
        if (p.status === 'ok') return `${p.platform}: +${p.problemsSolvedToday ?? 0} today (${p.totalSolved ?? 0} total)`
        if (p.status === 'skipped') return `${p.platform}: skipped (no username set)`
        return `${p.platform}: error — ${p.error ?? 'unknown'}`
      })
      setFetchMsg(`Fetched at ${new Date(data.fetchedAt).toLocaleTimeString()} · ${data.totalSolvedToday} solved today\n${parts.join('\n')}`)
    }
    setFetching(false)
  }

  const inputClass = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm'

  if (loading) return <LoadingSpinner text="Loading DSA profile..." />

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Code2 size={22} className="text-indigo-400" />
        <h1 className="text-2xl font-bold text-white">DSA Tracker</h1>
      </div>

      {/* Profile card */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Profile</h2>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
              <Pencil size={14} /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors">
                <X size={14} /> Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                <Check size={14} /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {!editing ? (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'LeetCode', value: profile?.lcUsername },
              { label: 'Codeforces', value: profile?.cfHandle },
              { label: 'CodeChef', value: profile?.ccUsername },
              { label: 'CSES', value: profile?.csesUsername },
              { label: 'Daily Target', value: `${profile?.dailyTarget} problems` },
              { label: 'Target CF Rating', value: profile?.targetCfRating ?? '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                <p className={`text-sm font-medium ${value && value !== '—' ? 'text-white' : 'text-gray-600'}`}>
                  {value || 'Not set'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">LeetCode Username</label>
                <input type="text" value={form.lcUsername} onChange={e => setForm(f => ({ ...f, lcUsername: e.target.value }))} className={inputClass} placeholder="username" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Codeforces Handle</label>
                <input type="text" value={form.cfHandle} onChange={e => setForm(f => ({ ...f, cfHandle: e.target.value }))} className={inputClass} placeholder="handle" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">CodeChef Username</label>
                <input type="text" value={form.ccUsername} onChange={e => setForm(f => ({ ...f, ccUsername: e.target.value }))} className={inputClass} placeholder="username" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">CSES Username</label>
                <input type="text" value={form.csesUsername} onChange={e => setForm(f => ({ ...f, csesUsername: e.target.value }))} className={inputClass} placeholder="username" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Daily Target</label>
                <input type="number" min={1} value={form.dailyTarget} onChange={e => setForm(f => ({ ...f, dailyTarget: parseInt(e.target.value) || 5 }))} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Target CF Rating</label>
                <input type="number" value={form.targetCfRating} onChange={e => setForm(f => ({ ...f, targetCfRating: e.target.value }))} className={inputClass} placeholder="e.g. 1800" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Phase 2 info card */}
      <div className="bg-indigo-950/40 border border-indigo-800/50 rounded-xl p-5">
        <h3 className="font-medium text-indigo-300 mb-1">Automated Data Fetching</h3>
        <p className="text-gray-400 text-sm mb-4">
          Nightly auto-fetch from LeetCode, Codeforces, CodeChef, and CSES arrives in Phase 2.
          Use the button below to test the endpoint manually.
        </p>
        <button
          onClick={triggerFetch}
          disabled={fetching}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <RefreshCw size={14} className={fetching ? 'animate-spin' : ''} />
          {fetching ? 'Triggering...' : 'Trigger Fetch'}
        </button>
        {fetchMsg && (
          <pre className="mt-3 text-sm text-indigo-300 bg-indigo-900/30 rounded-lg px-3 py-2 whitespace-pre-wrap font-sans">{fetchMsg}</pre>
        )}
      </div>
    </div>
  )
}
