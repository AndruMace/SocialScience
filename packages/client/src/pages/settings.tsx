import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useLlmAvailability } from '../hooks/use-llm-availability'
import { useUIStore } from '../stores/ui.store'
import { LLM_PROVIDERS } from '@socialscience/shared'

function apiKeyForProvider(settings: Record<string, string>, provider: string): string {
  if (provider === 'claude') return settings['anthropic_api_key'] ?? ''
  if (provider === 'openai') return settings['openai_api_key'] ?? ''
  if (provider === 'gemini') return settings['gemini_api_key'] ?? ''
  return ''
}

export default function SettingsPage() {
  const qc = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)
  const { data: llmAvail } = useLlmAvailability()
  const llmDisconnected = llmAvail?.connected !== true
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    api.get<Record<string, string>>('/settings').then((s) => { setSettings(s); setLoading(false) })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/settings', settings)
      await qc.invalidateQueries({ queryKey: ['llm-availability'] })
      addToast({ title: 'SETTINGS SAVED', type: 'success' })
    } catch (err) {
      addToast({ title: 'SAVE FAILED', description: (err as Error).message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function testProvider() {
    setTesting(true)
    try {
      const provider = settings['default_llm_provider'] ?? 'claude'
      const result = await api.post<{ ok: boolean; error?: string }>('/settings/llm/test', {
        provider,
        apiKey: apiKeyForProvider(settings, provider),
      })
      addToast({
        title: result.ok ? 'CONNECTION OK' : 'CONNECTION FAILED',
        description: result.ok ? undefined : result.error,
        type: result.ok ? 'success' : 'error',
      })
    } catch (err) {
      addToast({ title: 'TEST FAILED', description: (err as Error).message, type: 'error' })
    } finally {
      setTesting(false)
    }
  }

  const inputClass = "w-full pixel-border bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]"
  const field = (label: string, children: React.ReactNode) => (
    <div className="space-y-1">
      <label className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">{label}</label>
      {children}
    </div>
  )

  if (loading) return <div className="font-pixel text-[8px] text-[hsl(var(--muted-foreground))]">LOADING...</div>

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="font-pixel text-[12px] text-[hsl(var(--foreground))]">OPTIONS</h1>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="card-pixel p-5 space-y-4">
          <div className="font-pixel text-[8px] text-[hsl(var(--muted-foreground))]">LLM PROVIDERS (OPTIONAL)</div>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed">
            Only required if you enable AI drafting in an account&apos;s Strategy. You can compose posts manually and
            publish from the queue without configuring providers or API keys.
          </p>
          {llmDisconnected && (
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] pixel-border border-[hsl(var(--secondary))] p-3">
              No API key is saved yet—AI actions in the post composer stay disabled until you add and save a key below.
            </p>
          )}

          {field('DEFAULT PROVIDER', (
            <select
              value={settings['default_llm_provider'] ?? 'claude'}
              onChange={(e) => setSettings({ ...settings, default_llm_provider: e.target.value })}
              className={inputClass}
            >
              {Object.entries(LLM_PROVIDERS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
            </select>
          ))}

          {field('ANTHROPIC API KEY', (
            <input type="password" value={settings['anthropic_api_key'] ?? ''}
              onChange={(e) => setSettings({ ...settings, anthropic_api_key: e.target.value })}
              placeholder="sk-ant-..." className={inputClass} />
          ))}

          {field('OPENAI API KEY', (
            <input type="password" value={settings['openai_api_key'] ?? ''}
              onChange={(e) => setSettings({ ...settings, openai_api_key: e.target.value })}
              placeholder="sk-..." className={inputClass} />
          ))}

          {field('GEMINI API KEY', (
            <input type="password" value={settings['gemini_api_key'] ?? ''}
              onChange={(e) => setSettings({ ...settings, gemini_api_key: e.target.value })}
              placeholder="Google AI Studio key"
              className={inputClass} />
          ))}

          <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed">
            <strong className="text-[hsl(var(--foreground))]">Test connection</strong> uses whatever is currently in the API
            key field for your <strong className="text-[hsl(var(--foreground))]">Default provider</strong> (no need to save
            first). Save when you want keys stored for later sessions.
          </p>

          <button type="button" onClick={testProvider} disabled={testing}
            className="btn-pixel px-4 py-2 text-xs font-pixel text-[7px]">
            {testing ? 'TESTING...' : 'TEST CONNECTION'}
          </button>
        </div>

        <button type="submit" disabled={saving}
          className="w-full btn-pixel bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] py-3 font-pixel text-[8px]">
          {saving ? 'SAVING...' : 'SAVE OPTIONS'}
        </button>
      </form>
    </div>
  )
}
