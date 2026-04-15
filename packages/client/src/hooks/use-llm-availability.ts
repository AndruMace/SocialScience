import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth.store'

/** `connected` is true when the user has saved a non-empty Anthropic or OpenAI key in Options (not server env alone). */
export interface LlmAvailability {
  connected: boolean
}

export function useLlmAvailability() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['llm-availability'],
    queryFn: () => api.get<LlmAvailability>('/settings/llm/availability'),
    enabled: !!token,
    staleTime: 60_000,
  })
}
