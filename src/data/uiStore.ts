import { create } from 'zustand'

interface Toast {
  id: number
  text: string
  kind: 'ok' | 'error'
}

interface UiState {
  toasts: Toast[]
  toast(text: string, kind?: Toast['kind']): void
}

let n = 0
export const useUi = create<UiState>((set) => ({
  toasts: [],
  toast: (text, kind = 'ok') => {
    const id = ++n
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, text, kind }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2400)
  },
}))

export const toast = (text: string, kind?: 'ok' | 'error') => useUi.getState().toast(text, kind)
