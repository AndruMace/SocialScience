import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Post, GeneratePostRequest, CreatePostRequest, UpdatePostRequest } from '@socialscience/shared'

export function usePosts(accountId?: string, status?: string) {
  const params = new URLSearchParams()
  if (accountId) params.set('accountId', accountId)
  if (status) params.set('status', status)
  const qs = params.toString()
  return useQuery({
    queryKey: ['posts', accountId, status],
    queryFn: () => api.get<Post[]>(`/posts${qs ? `?${qs}` : ''}`),
  })
}

export function useGeneratePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: GeneratePostRequest) => api.post<Post>('/posts/generate', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  })
}

export function useCreatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePostRequest) => api.post<Post>('/posts', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  })
}

export function useUpdatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpdatePostRequest & { id: string }) =>
      api.patch<Post>(`/posts/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  })
}

export function usePublishPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<Post>(`/posts/${id}/publish`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] })
      qc.invalidateQueries({ queryKey: ['game'] })
    },
  })
}

export function useSchedulePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, scheduledFor }: { id: string; scheduledFor: string }) =>
      api.post<Post>(`/posts/${id}/schedule`, { scheduledFor }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  })
}

export function useDeletePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/posts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  })
}
