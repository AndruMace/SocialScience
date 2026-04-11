import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Account, AccountSummary, ConnectAccountRequest, RegisterBlueskyAccountRequest } from '@socialscience/shared'

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get<AccountSummary[]>('/accounts'),
  })
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: ['accounts', id],
    queryFn: () => api.get<Account>(`/accounts/${id}`),
    enabled: !!id,
  })
}

export function useConnectAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ConnectAccountRequest) => api.post<Account>('/accounts', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  })
}

export function useRegisterBlueskyAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RegisterBlueskyAccountRequest) => api.post<Account>('/accounts/bluesky/register', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  })
}

export function useDeleteAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/accounts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  })
}
