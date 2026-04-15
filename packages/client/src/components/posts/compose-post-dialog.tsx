import { useState } from 'react'
import type { Account } from '@socialscience/shared'
import { useAiPreview, useCreatePost } from '../../hooks/use-posts'
import { useLlmAvailability } from '../../hooks/use-llm-availability'
import { LlmUnavailableRegion } from '../llm/llm-unavailable-region'
import { useUIStore } from '../../stores/ui.store'

const MAX_LEN = 300

interface ComposePostDialogProps {
  account: Account
  onClose: () => void
  /** When false, hide AI actions (manual-only). */
  llmEnabled?: boolean
}

export function ComposePostDialog({ account, onClose, llmEnabled = true }: ComposePostDialogProps) {
  const [content, setContent] = useState('')
  const [contextHint, setContextHint] = useState('')
  const { mutateAsync: previewAi, isPending: aiPending, error: aiError, reset: resetAiError } = useAiPreview()
  const { mutateAsync: createPost, isPending: savePending, error: saveError } = useCreatePost()
  const addToast = useUIStore((s) => s.addToast)
  const { data: llmAvail, isLoading: llmAvailLoading } = useLlmAvailability()

  const busy = aiPending || savePending
  const aiActive = llmEnabled !== false
  const isLlmReady = llmAvail?.connected === true
  const aiLocked = aiActive && (llmAvailLoading || !isLlmReady)

  async function handleGenerateFromScratch() {
    try {
      resetAiError()
      const { content: suggested } = await previewAi({
        accountId: account.id,
        contextHint: contextHint.trim() || undefined,
      })
      setContent(suggested.slice(0, MAX_LEN))
    } catch {
      /* shown via aiError */
    }
  }

  async function handleAugment() {
    const draft = content.trim()
    if (!draft) {
      addToast({ title: 'ADD TEXT FIRST', description: 'Write something to augment.', type: 'error' })
      return
    }
    try {
      resetAiError()
      const { content: suggested } = await previewAi({
        accountId: account.id,
        contextHint: contextHint.trim() || undefined,
        augmentDraft: draft,
      })
      setContent(suggested.slice(0, MAX_LEN))
    } catch {
      /* shown via aiError */
    }
  }

  async function handleSaveDraft(e: React.FormEvent) {
    e.preventDefault()
    const text = content.trim()
    if (!text) return
    try {
      await createPost({ accountId: account.id, content: text })
      addToast({ title: 'POST SAVED', description: 'Draft ready in your queue.', type: 'success' })
      onClose()
    } catch {
      // inline
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
      <div className="card-pixel pixel-shadow-primary w-full max-w-lg p-6 my-8">
        <div className="font-pixel text-[10px] text-[hsl(var(--primary))] mb-1">NEW POST</div>
        <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-4">
          Write for @{account.handle}. Use AI below to generate from scratch or improve your draft—optional.
        </p>

        <form onSubmit={handleSaveDraft} className="space-y-4">
          <div className="space-y-1">
            <label className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">POST TEXT</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_LEN))}
              placeholder="What do you want to say?"
              rows={7}
              className="w-full pixel-border bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))] resize-none"
              autoFocus
            />
            <div className="text-[10px] text-[hsl(var(--muted-foreground))] text-right">
              {content.length}/{MAX_LEN}
            </div>
          </div>

          {aiActive && (
            <LlmUnavailableRegion inactive={aiLocked} className="space-y-4">
              <div className="space-y-1">
                <label className="font-pixel text-[7px] text-[hsl(var(--muted-foreground))]">
                  AI CONTEXT (optional)
                </label>
                <input
                  type="text"
                  value={contextHint}
                  onChange={(e) => setContextHint(e.target.value)}
                  placeholder="e.g. topic, news, tone hint—for generate & augment"
                  disabled={aiLocked}
                  className="w-full pixel-border bg-[hsl(var(--input))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))] disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleGenerateFromScratch()}
                  disabled={busy || aiLocked}
                  className="btn-pixel flex-1 min-w-[140px] bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] py-2 font-pixel text-[8px] disabled:opacity-60"
                >
                  {aiPending ? 'WORKING...' : '✦ GENERATE WITH AI'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleAugment()}
                  disabled={busy || aiLocked}
                  className="btn-pixel flex-1 min-w-[140px] py-2 font-pixel text-[8px] border-[hsl(var(--secondary))] disabled:opacity-60"
                >
                  {aiPending ? 'WORKING...' : '✦ AUGMENT DRAFT'}
                </button>
              </div>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                <strong>Generate</strong> fills the box from your strategy. <strong>Augment</strong> rewrites what you
                already wrote. Results stay here until you save.
              </p>
            </LlmUnavailableRegion>
          )}

          {!aiActive && (
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] pixel-border border-[hsl(var(--secondary))] p-3">
              AI is off for this account (Strategy). Turn it on under Strategy and add API keys in Options to use AI here.
            </p>
          )}

          {aiError && (
            <div className="pixel-border border-[hsl(var(--destructive))] p-2 text-sm text-[hsl(var(--destructive))]">
              {(aiError as Error).message}
            </div>
          )}
          {saveError && (
            <div className="pixel-border border-[hsl(var(--destructive))] p-2 text-sm text-[hsl(var(--destructive))]">
              {(saveError as Error).message}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={savePending || !content.trim()}
              className="flex-1 btn-pixel bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] py-2 font-pixel text-[8px]"
            >
              {savePending ? 'SAVING...' : 'SAVE DRAFT'}
            </button>
            <button type="button" onClick={onClose} className="btn-pixel px-4 py-2 font-pixel text-[8px]">
              CANCEL
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
