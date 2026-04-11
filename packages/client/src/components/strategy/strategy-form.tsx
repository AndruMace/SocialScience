import { useState } from 'react'
import type { Strategy } from '@socialscience/shared'
import { LLM_PROVIDERS } from '@socialscience/shared'
import { api } from '../../lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { useUIStore } from '../../stores/ui.store'

interface StrategyFormProps {
  accountId: string
  initial?: Strategy | null
}

const TONES = ['Professional', 'Casual', 'Sarcastic', 'Inspirational', 'Informative', 'Gen-Z Casual', 'Humorous', 'Educational']

export function StrategyForm({ accountId, initial }: StrategyFormProps) {
  const qc = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    niche: initial?.niche ?? '',
    tone: initial?.tone ?? 'Professional',
    personaPrompt: initial?.personaPrompt ?? '',
    postFrequency: initial?.postFrequency ?? 3,
    scheduleStart: initial?.scheduleStart ?? '09:00',
    scheduleEnd: initial?.scheduleEnd ?? '21:00',
    timezone: initial?.timezone ?? 'UTC',
    postMode: initial?.postMode ?? 'queue',
    llmProvider: initial?.llmProvider ?? '',
    llmModel: initial?.llmModel ?? '',
    engagementRules: initial?.engagementRules ?? {
      autoLike: false,
      autoReply: false,
      followBack: false,
      quotePostTrending: false,
    },
  })

  const providerList = Object.entries(LLM_PROVIDERS)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/accounts/${accountId}/strategy`, {
        ...form,
        llmProvider: form.llmProvider || null,
        llmModel: form.llmModel || null,
        personaPrompt: form.personaPrompt || null,
      })
      await qc.invalidateQueries({ queryKey: ['strategy', accountId] })
      addToast({ title: 'STRATEGY SAVED', type: 'success' })
    } catch (err) {
      addToast({ title: 'SAVE FAILED', description: (err as Error).message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const field = (label: string, children: React.ReactNode) => (
    <div className="space-y-1">
      <label className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">{label}</label>
      {children}
    </div>
  )

  const inputClass = "w-full pixel-border bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]"
  const selectClass = inputClass + " cursor-pointer"

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {field('NICHE / TOPIC', (
        <input value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })}
          placeholder="e.g. tech news, cooking tips, crypto commentary"
          className={inputClass} required />
      ))}

      {field('TONE / PERSONA', (
        <select value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} className={selectClass}>
          {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      ))}

      {field('CUSTOM PERSONA PROMPT (optional)', (
        <textarea value={form.personaPrompt} onChange={(e) => setForm({ ...form, personaPrompt: e.target.value })}
          placeholder="Additional instructions for the AI persona..."
          className={inputClass + " resize-none"} rows={3} />
      ))}

      <div className="grid grid-cols-2 gap-4">
        {field('POSTS PER DAY', (
          <input type="number" min={1} max={20} value={form.postFrequency}
            onChange={(e) => setForm({ ...form, postFrequency: parseInt(e.target.value) })}
            className={inputClass} />
        ))}
        {field('POST MODE', (
          <select value={form.postMode} onChange={(e) => setForm({ ...form, postMode: e.target.value as 'auto' | 'queue' })} className={selectClass}>
            <option value="queue">Queue (approve first)</option>
            <option value="auto">Auto-post</option>
          </select>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {field('WINDOW START', (
          <input type="time" value={form.scheduleStart}
            onChange={(e) => setForm({ ...form, scheduleStart: e.target.value })} className={inputClass} />
        ))}
        {field('WINDOW END', (
          <input type="time" value={form.scheduleEnd}
            onChange={(e) => setForm({ ...form, scheduleEnd: e.target.value })} className={inputClass} />
        ))}
      </div>

      {field('LLM PROVIDER (overrides global setting)', (
        <select value={form.llmProvider} onChange={(e) => setForm({ ...form, llmProvider: e.target.value, llmModel: '' })} className={selectClass}>
          <option value="">Use global default</option>
          {providerList.map(([key, p]) => <option key={key} value={key}>{p.name}</option>)}
        </select>
      ))}

      {form.llmProvider && field('MODEL', (
        <select value={form.llmModel} onChange={(e) => setForm({ ...form, llmModel: e.target.value })} className={selectClass}>
          <option value="">Provider default</option>
          {LLM_PROVIDERS[form.llmProvider as keyof typeof LLM_PROVIDERS]?.models.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      ))}

      <div className="space-y-2">
        <div className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">ENGAGEMENT RULES</div>
        {([
          ['autoLike', 'Auto-like posts in niche'],
          ['autoReply', 'Auto-reply to mentions'],
          ['followBack', 'Auto follow-back'],
          ['quotePostTrending', 'Quote-post trending content'],
        ] as const).map(([key, label]) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer">
            <div
              className={`w-4 h-4 pixel-border flex items-center justify-center ${form.engagementRules[key] ? 'bg-[hsl(var(--primary))]' : ''}`}
              onClick={() => setForm({ ...form, engagementRules: { ...form.engagementRules, [key]: !form.engagementRules[key] } })}
            >
              {form.engagementRules[key] && <span className="text-[8px] text-black">✓</span>}
            </div>
            <span className="text-sm">{label}</span>
          </label>
        ))}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full btn-pixel bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] py-3 font-pixel text-[8px]"
      >
        {saving ? 'SAVING...' : 'SAVE STRATEGY'}
      </button>
    </form>
  )
}
