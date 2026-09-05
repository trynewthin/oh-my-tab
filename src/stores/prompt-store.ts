import { create } from "zustand"

type PromptState = {
  draft: string
  setDraft: (draft: string) => void
}

export const usePromptStore = create<PromptState>()((set) => ({
  draft: "",
  setDraft: (draft) => set({ draft }),
}))
