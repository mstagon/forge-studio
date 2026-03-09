import { create } from 'zustand'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
}

interface ToastState {
  toasts: Toast[]
  addToast: (type: Toast['type'], message: string) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (type, message) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    set({ toasts: [...get().toasts, { id, type, message }] })
    setTimeout(() => get().removeToast(id), 4000)
  },
  removeToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) })
}))

export const toast = {
  success: (msg: string): void => useToastStore.getState().addToast('success', msg),
  error: (msg: string): void => useToastStore.getState().addToast('error', msg),
  warning: (msg: string): void => useToastStore.getState().addToast('warning', msg),
  info: (msg: string): void => useToastStore.getState().addToast('info', msg)
}
