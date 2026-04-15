import { useState } from 'react'
import type { Strategy } from '@socialscience/shared'
import { LLM_PROVIDERS } from '@socialscience/shared'
import { api } from '../../lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { useLlmAvailability } from '../../hooks/use-llm-availability'
import { LlmUnavailableRegion } from '../llm/llm-unavailable-region'
import { useUIStore } from '../../stores/ui.store'

interface StrategyFormProps {
  accountId: string
  initial?: Strategy | null
}

const TONES = ['Professional', 'Casual', 'Sarcastic', 'Inspirational', 'Informative', 'Gen-Z Casual', 'Humorous', 'Educational']

export function StrategyForm({ accountId, initial }: StrategyFormProps) {
  const qc = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)
  const { data: llmAvail } = useLlmAvailability()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    llmEnabled: initial?.llmEnabled ?? true,
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

  const isLlmReady = llmAvail?.connected === true
  const llmDisconnected = !isLlmReady
  const aiConfigBlocked = form.llmEnabled && llmDisconnected
  const cantTurnAiOn = llmDisconnected && !form.llmEnabled

  const providerList = Object.entries(LLM_PROVIDERS)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const llmEnabled = form.llmEnabled
      const postMode = llmEnabled ? form.postMode : 'queue'
      await api.put(`/accounts/${accountId}/strategy`, {
        ...form,
        postMode,
        llmEnabled,
        llmProvider: llmEnabled ? form.llmProvider || null : null,
        llmModel: llmEnabled ? form.llmModel || null : null,
        personaPrompt: llmEnabled ? form.personaPrompt || null : null,
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
      <LlmUnavailableRegion inactive={cantTurnAiOn} className="pixel-border border-[hsl(var(--secondary))] p-4 space-y-2">
        <label className={`flex items-start gap-3 ${cantTurnAiOn ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            checked={form.llmEnabled}
            onChange={(e) => {
              const llmEnabled = e.target.checked
              setForm({
                ...form,
                llmEnabled,
                postMode: llmEnabled ? form.postMode : 'queue',
              })
            }}
            disabled={cantTurnAiOn}
            className="mt-1"
          />
          <span>
            <span className="font-pixel text-[8px] text-[hsl(var(--foreground))]">USE AI FOR DRAFTS &amp; AUTO-SCHEDULE</span>
            <span className="block text-[10px] text-[hsl(var(--muted-foreground))] mt-1">
              Turn off to run the account fully manually. You can still compose posts from the Posts tab without an API key.
            </span>
          </span>
        </label>
      </LlmUnavailableRegion>

      {form.llmEnabled && (
        <>
          {aiConfigBlocked && (
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] pixel-border border-[hsl(var(--destructive))] p-3">
              AI is enabled but no API key is configured. Add keys under <strong>Options</strong>, or turn AI off above.
            </p>
          )}
          <LlmUnavailableRegion inactive={aiConfigBlocked} className="space-y-5">
          {field('NICHE / TOPIC', (
            <input value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })}
              placeholder="e.g. tech news, cooking tips, crypto commentary"
              className={inputClass} required disabled={aiConfigBlocked} />
          ))}

          {field('TONE / PERSONA', (
            <select value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} className={selectClass} disabled={aiConfigBlocked}>
              {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          ))}

          {field('CUSTOM PERSONA PROMPT (optional)', (
            <textarea value={form.personaPrompt} onChange={(e) => setForm({ ...form, personaPrompt: e.target.value })}
              placeholder="Additional instructions for the AI persona..."
              className={inputClass + " resize-none"} rows={3} disabled={aiConfigBlocked} />
          ))}

          <div className="grid grid-cols-2 gap-4">
            {field('POSTS PER DAY', (
              <input type="number" min={1} max={20} value={form.postFrequency}
                onChange={(e) => setForm({ ...form, postFrequency: parseInt(e.target.value) })}
                className={inputClass} disabled={aiConfigBlocked} />
            ))}
            {field('POST MODE', (
              <select value={form.postMode} onChange={(e) => setForm({ ...form, postMode: e.target.value as 'auto' | 'queue' })} className={selectClass} disabled={aiConfigBlocked}>
                <option value="queue">Queue (approve first)</option>
                <option value="auto">Auto-post (AI-generated)</option>
              </select>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {field('WINDOW START', (
              <input type="time" value={form.scheduleStart}
                onChange={(e) => setForm({ ...form, scheduleStart: e.target.value })} className={inputClass} disabled={aiConfigBlocked} />
            ))}
            {field('WINDOW END', (
              <input type="time" value={form.scheduleEnd}
                onChange={(e) => setForm({ ...form, scheduleEnd: e.target.value })} className={inputClass} disabled={aiConfigBlocked} />
            ))}
          </div>

          {field('LLM PROVIDER (overrides global setting)', (
            <select value={form.llmProvider} onChange={(e) => setForm({ ...form, llmProvider: e.target.value, llmModel: '' })} className={selectClass} disabled={aiConfigBlocked}>
              <option value="">Use global default</option>
              {providerList.map(([key, p]) => <option key={key} value={key}>{p.name}</option>)}
            </select>
          ))}

          {form.llmProvider && field('MODEL', (
            <select value={form.llmModel} onChange={(e) => setForm({ ...form, llmModel: e.target.value })} className={selectClass} disabled={aiConfigBlocked}>
              <option value="">Provider default</option>
              {LLM_PROVIDERS[form.llmProvider as keyof typeof LLM_PROVIDERS]?.models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          ))}
          </LlmUnavailableRegion>
        </>
      )}

      {!form.llmEnabled && (
        <p className="text-[10px] text-[hsl(var(--muted-foreground))] pixel-border p-3">
          Manual mode: use <strong>New post</strong> on the Posts tab. Optional API keys in Settings are only needed if you turn AI back on.
        </p>
      )}

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
