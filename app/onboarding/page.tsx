'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Flame, ChevronRight, ChevronLeft } from 'lucide-react'
import type { LearningMode } from '@/types'

const TOTAL_STEPS = 3

const LEARNING_MODES: { value: LearningMode; label: string }[] = [
  { value: 'watch_lectures', label: 'Watch Lectures' },
  { value: 'build_projects', label: 'Build Projects' },
  { value: 'read_docs', label: 'Read Docs' },
  { value: 'practice_problems', label: 'Practice Problems' },
  { value: 'mock_interviews', label: 'Mock Interviews' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { update } = useSession()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1 — DSA
  const [dsa, setDsa] = useState({
    lcUsername: '', cfHandle: '', ccUsername: '', csesUsername: '',
    dailyTarget: 5, targetCfRating: '',
  })

  // Step 2 — Gym
  const [gym, setGym] = useState({
    currentWeightKg: '', heightCm: '', targetWeightKg: '',
    goal: '', experienceLevel: '', trainingDaysPerWeek: '',
    programSplit: '', injuryNotes: '',
  })

  // Step 3 — Skill
  const [skill, setSkill] = useState({
    name: '', description: '', totalHoursEstimated: '',
    learningModes: [] as LearningMode[], specificGoal: '',
    deadline: '', resources: '',
  })

  function toggleMode(mode: LearningMode) {
    setSkill(s => ({
      ...s,
      learningModes: s.learningModes.includes(mode)
        ? s.learningModes.filter(m => m !== mode)
        : [...s.learningModes, mode],
    }))
  }

  async function handleDsaNext() {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/dsa/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lcUsername: dsa.lcUsername || null,
          cfHandle: dsa.cfHandle || null,
          ccUsername: dsa.ccUsername || null,
          csesUsername: dsa.csesUsername || null,
          dailyTarget: dsa.dailyTarget,
          targetCfRating: dsa.targetCfRating ? parseInt(dsa.targetCfRating) : null,
        }),
      })
      if (!res.ok) throw new Error('Failed to save DSA profile')
      setStep(2)
    } catch {
      setError('Failed to save DSA profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGymNext() {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/gym/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentWeightKg: gym.currentWeightKg ? parseFloat(gym.currentWeightKg) : null,
          heightCm: gym.heightCm ? parseInt(gym.heightCm) : null,
          targetWeightKg: gym.targetWeightKg ? parseFloat(gym.targetWeightKg) : null,
          goal: gym.goal || null,
          experienceLevel: gym.experienceLevel || null,
          trainingDaysPerWeek: gym.trainingDaysPerWeek ? parseInt(gym.trainingDaysPerWeek) : null,
          programSplit: gym.programSplit || null,
          injuryNotes: gym.injuryNotes || null,
        }),
      })
      if (!res.ok) throw new Error('Failed to save gym profile')
      setStep(3)
    } catch {
      setError('Failed to save gym profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleFinish(skipSkill = false) {
    setLoading(true); setError('')
    try {
      if (!skipSkill && skill.name.trim()) {
        const res = await fetch('/api/skills/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: skill.name,
            description: skill.description || null,
            totalHoursEstimated: parseInt(skill.totalHoursEstimated) || 10,
            learningModes: skill.learningModes,
            specificGoal: skill.specificGoal || null,
            deadline: skill.deadline || null,
            resources: skill.resources || null,
          }),
        })
        if (!res.ok) throw new Error('Failed to save skill')
      }

      const onboardRes = await fetch('/api/user/onboard', { method: 'PATCH' })
      if (!onboardRes.ok) throw new Error('Failed to complete onboarding')

      await update()
      router.push('/')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
  const labelClass = 'block text-sm font-medium text-gray-300 mb-1'

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Flame size={24} className="text-indigo-400" />
            <span className="text-2xl font-bold text-white">
              Grind<span className="text-indigo-400">OS</span>
            </span>
          </div>
          <p className="text-gray-400 text-sm">Let&apos;s set up your profile</p>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i + 1 === step ? 'w-8 bg-indigo-500' : i + 1 < step ? 'w-2 bg-indigo-700' : 'w-2 bg-gray-700'
              }`}
            />
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* ── Step 1: DSA ── */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">DSA Setup</h2>
              <p className="text-gray-400 text-sm mb-5">Link your competitive programming accounts for automated tracking.</p>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>LeetCode Username</label>
                  <input type="text" value={dsa.lcUsername} onChange={e => setDsa(d => ({ ...d, lcUsername: e.target.value }))} className={inputClass} placeholder="your_lc_username" />
                </div>
                <div>
                  <label className={labelClass}>Codeforces Handle</label>
                  <input type="text" value={dsa.cfHandle} onChange={e => setDsa(d => ({ ...d, cfHandle: e.target.value }))} className={inputClass} placeholder="your_cf_handle" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>CodeChef Username</label>
                    <input type="text" value={dsa.ccUsername} onChange={e => setDsa(d => ({ ...d, ccUsername: e.target.value }))} className={inputClass} placeholder="cc_username" />
                  </div>
                  <div>
                    <label className={labelClass}>CSES Username</label>
                    <input type="text" value={dsa.csesUsername} onChange={e => setDsa(d => ({ ...d, csesUsername: e.target.value }))} className={inputClass} placeholder="cses_username" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Daily Problem Target</label>
                    <input type="number" min={1} value={dsa.dailyTarget} onChange={e => setDsa(d => ({ ...d, dailyTarget: parseInt(e.target.value) || 5 }))} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Target CF Rating</label>
                    <input type="number" value={dsa.targetCfRating} onChange={e => setDsa(d => ({ ...d, targetCfRating: e.target.value }))} className={inputClass} placeholder="e.g. 1800" />
                  </div>
                </div>
              </div>
              <button
                onClick={handleDsaNext}
                disabled={loading}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
              >
                {loading ? 'Saving...' : <><span>Next</span><ChevronRight size={16} /></>}
              </button>
            </div>
          )}

          {/* ── Step 2: Gym ── */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Gym Profile</h2>
              <p className="text-gray-400 text-sm mb-5">Your training details for progress tracking.</p>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>Weight (kg)</label>
                    <input type="number" step="0.1" value={gym.currentWeightKg} onChange={e => setGym(g => ({ ...g, currentWeightKg: e.target.value }))} className={inputClass} placeholder="70" />
                  </div>
                  <div>
                    <label className={labelClass}>Height (cm)</label>
                    <input type="number" value={gym.heightCm} onChange={e => setGym(g => ({ ...g, heightCm: e.target.value }))} className={inputClass} placeholder="175" />
                  </div>
                  <div>
                    <label className={labelClass}>Target (kg)</label>
                    <input type="number" step="0.1" value={gym.targetWeightKg} onChange={e => setGym(g => ({ ...g, targetWeightKg: e.target.value }))} className={inputClass} placeholder="76" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Goal</label>
                    <select value={gym.goal} onChange={e => setGym(g => ({ ...g, goal: e.target.value }))} className={inputClass}>
                      <option value="">Select goal</option>
                      <option value="lean_bulk">Lean Bulk</option>
                      <option value="cut">Cut</option>
                      <option value="recomposition">Recomposition</option>
                      <option value="maintain">Maintain</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Experience</label>
                    <select value={gym.experienceLevel} onChange={e => setGym(g => ({ ...g, experienceLevel: e.target.value }))} className={inputClass}>
                      <option value="">Select level</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Training Days/Week</label>
                    <input type="number" min={1} max={7} value={gym.trainingDaysPerWeek} onChange={e => setGym(g => ({ ...g, trainingDaysPerWeek: e.target.value }))} className={inputClass} placeholder="4" />
                  </div>
                  <div>
                    <label className={labelClass}>Program / Split</label>
                    <input type="text" value={gym.programSplit} onChange={e => setGym(g => ({ ...g, programSplit: e.target.value }))} className={inputClass} placeholder="Push Pull Legs" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Injury Notes <span className="text-gray-500">(optional)</span></label>
                  <textarea value={gym.injuryNotes} onChange={e => setGym(g => ({ ...g, injuryNotes: e.target.value }))} rows={2} className={`${inputClass} resize-none`} placeholder="e.g. Left shoulder impingement" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="flex items-center gap-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition-colors">
                  <ChevronLeft size={16} /> Back
                </button>
                <button onClick={handleGymNext} disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors">
                  {loading ? 'Saving...' : <><span>Next</span><ChevronRight size={16} /></>}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: First Skill ── */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Add Your First Skill</h2>
              <p className="text-gray-400 text-sm mb-5">Track structured learning alongside your DSA and gym goals.</p>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Skill Name</label>
                  <input type="text" value={skill.name} onChange={e => setSkill(s => ({ ...s, name: e.target.value }))} className={inputClass} placeholder="e.g. Agentic AI, System Design" />
                </div>
                <div>
                  <label className={labelClass}>Description</label>
                  <textarea value={skill.description} onChange={e => setSkill(s => ({ ...s, description: e.target.value }))} rows={2} className={`${inputClass} resize-none`} placeholder="What does this skill mean to you?" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Estimated Hours</label>
                    <input type="number" min={1} value={skill.totalHoursEstimated} onChange={e => setSkill(s => ({ ...s, totalHoursEstimated: e.target.value }))} className={inputClass} placeholder="40" />
                  </div>
                  <div>
                    <label className={labelClass}>Deadline</label>
                    <input type="date" value={skill.deadline} onChange={e => setSkill(s => ({ ...s, deadline: e.target.value }))} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Learning Modes</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {LEARNING_MODES.map(({ value, label }) => (
                      <button key={value} type="button" onClick={() => toggleMode(value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          skill.learningModes.includes(value) ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Specific Goal</label>
                  <input type="text" value={skill.specificGoal} onChange={e => setSkill(s => ({ ...s, specificGoal: e.target.value }))} className={inputClass} placeholder="e.g. Complete LangChain course and build 2 projects" />
                </div>
                <div>
                  <label className={labelClass}>Resources <span className="text-gray-500">(optional)</span></label>
                  <textarea value={skill.resources} onChange={e => setSkill(s => ({ ...s, resources: e.target.value }))} rows={2} className={`${inputClass} resize-none`} placeholder="Course links, book names, etc." />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(2)} className="flex items-center gap-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition-colors">
                  <ChevronLeft size={16} /> Back
                </button>
                <button onClick={() => handleFinish(true)} disabled={loading} className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 font-medium rounded-lg transition-colors text-sm">
                  Skip
                </button>
                <button onClick={() => handleFinish(false)} disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors">
                  {loading ? 'Finishing...' : 'Add Skill & Finish'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
