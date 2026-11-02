import { create } from 'zustand';

export type ToastTone = 'info' | 'success' | 'error';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastState {
  items: ToastItem[];
  push: (toast: Omit<ToastItem, 'id'>) => string;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  items: [],
  push: (toast) => {
    const id = crypto.randomUUID();
    set({ items: [...get().items, { ...toast, id }] });
    window.setTimeout(() => {
      set({ items: get().items.filter((item) => item.id !== id) });
    }, toast.tone === 'error' ? 9000 : 4500);
    return id;
  },
  dismiss: (id) => set({ items: get().items.filter((item) => item.id !== id) }),
}));

export function toastInfo(title: string, description?: string): void {
  useToastStore.getState().push({ title, description, tone: 'info' });
}

export function toastSuccess(title: string, description?: string): void {
  useToastStore.getState().push({ title, description, tone: 'success' });
}

export function toastError(title: string, description?: string): void {
  useToastStore.getState().push({ title, description, tone: 'error' });
}
