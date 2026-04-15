import type { ReactNode } from 'react'
import { LLM_UNAVAILABLE_TOOLTIP } from '../../lib/llm-ui'

interface LlmUnavailableRegionProps {
  /** When true, region is grayed out and shows the standard tooltip on hover. */
  inactive: boolean
  children: ReactNode
  className?: string
}

/**
 * Wraps LLM-dependent controls. When `inactive`, applies muted styling and a native tooltip
 * (works when hovering the region; individual controls should also use `disabled`).
 */
export function LlmUnavailableRegion({ inactive, children, className = '' }: LlmUnavailableRegionProps) {
  return (
    <div
      title={inactive ? LLM_UNAVAILABLE_TOOLTIP : undefined}
      className={`${className} ${inactive ? 'opacity-[0.42] cursor-not-allowed' : ''}`}
    >
      {children}
    </div>
  )
}
