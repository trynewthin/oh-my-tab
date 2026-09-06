import { create } from "zustand"

export type ToastMessage = {
  dismissed?: boolean
  id: string
  message: string
  kind: "success" | "error" | "info" | "warning"
  action?: { label: string; run: () => void }
}
export const useToastStore = create<{
  messages: ToastMessage[]
  dismiss: (id: string) => void
  remove: (id: string) => void
}>()((set) => ({
  messages: [],
  dismiss: (id) =>
    set((state) => ({
      messages: state.messages.map((item) =>
        item.id === id ? { ...item, dismissed: true } : item
      ),
    })),
  remove: (id) =>
    set((state) => ({
      messages: state.messages.filter((item) => item.id !== id),
    })),
}))
export function toast(
  message: string,
  kind: ToastMessage["kind"] = "info",
  action?: ToastMessage["action"]
) {
  const id = crypto.randomUUID()
  useToastStore.setState((state) => ({
    messages: [
      ...state.messages.filter(
        (item) =>
          action ||
          item.action ||
          item.message !== message ||
          item.kind !== kind
      ),
      { id, message, kind, action },
    ],
  }))
  return id
}
