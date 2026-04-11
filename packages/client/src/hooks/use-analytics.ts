import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { AnalyticsSnapshot } from '@socialscience/shared'

export function useAccountAnalytics(accountId: string, from?: string, to?: string) {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const qs = params.toString()
  return useQuery({
    queryKey: ['analytics', accountId, from, to],
    queryFn: () => api.get<AnalyticsSnapshot[]>(`/analytics/accounts/${accountId}${qs ? `?${qs}` : ''}`),
    enabled: !!accountId,
  })
}

export function useLatestSnapshot(accountId: string) {
  return useQuery({
    queryKey: ['analytics-latest', accountId],
    queryFn: () => api.get<AnalyticsSnapshot | null>(`/analytics/accounts/${accountId}/latest`),
    enabled: !!accountId,
    refetchInterval: 15 * 60 * 1000,
  })
}

export function useRefreshAnalytics(accountId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post(`/analytics/accounts/${accountId}/refresh`),
    onSuccess: () => {
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ['analytics', accountId] })
        qc.invalidateQueries({ queryKey: ['analytics-latest', accountId] })
      }, 3000)
    },
  })
}

export function useStrategy(accountId: string) {
  return useQuery({
    queryKey: ['strategy', accountId],
    queryFn: () => api.get(`/accounts/${accountId}/strategy`),
    enabled: !!accountId,
  })
}
