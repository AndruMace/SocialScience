import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { GameState, Achievement, AchievementDef, XpEvent, LeaderboardEntry } from '@socialscience/shared'

export function useGameState(accountId: string) {
  return useQuery({
    queryKey: ['game', accountId],
    queryFn: () => api.get<GameState>(`/game/accounts/${accountId}`),
    enabled: !!accountId,
  })
}

export function useAchievements(accountId: string) {
  return useQuery({
    queryKey: ['achievements', accountId],
    queryFn: () => api.get<Achievement[]>(`/game/accounts/${accountId}/achievements`),
    enabled: !!accountId,
  })
}

export function useXpHistory(accountId: string) {
  return useQuery({
    queryKey: ['xp-history', accountId],
    queryFn: () => api.get<XpEvent[]>(`/game/accounts/${accountId}/xp-history`),
    enabled: !!accountId,
  })
}

export function useAchievementCatalog() {
  return useQuery({
    queryKey: ['achievement-catalog'],
    queryFn: () => api.get<AchievementDef[]>('/game/achievements/catalog'),
    staleTime: Infinity,
  })
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.get<LeaderboardEntry[]>('/analytics/leaderboard'),
    refetchInterval: 60_000,
  })
}
