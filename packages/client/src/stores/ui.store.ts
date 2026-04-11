import { create } from 'zustand'

interface Toast {
  id: string
  title: string
  description?: string
  type: 'achievement' | 'levelup' | 'success' | 'error'
}

interface UIState {
  sidebarCollapsed: boolean
  toasts: Toast[]
  setSidebarCollapsed: (v: boolean) => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toasts: [],
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  addToast: (toast) =>
    set((s) => ({
      toasts: [...s.toasts, { ...toast, id: Math.random().toString(36).slice(2) }],
    })),
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
