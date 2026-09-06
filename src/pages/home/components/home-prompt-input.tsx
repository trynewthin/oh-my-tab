import { ArrowUp } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import {
  PromptInput,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input"
import { usePromptStore } from "@/stores/prompt-store"

import SearchEngineSelect from "@/pages/home/components/search-engine-select"

import ThemeToggle from "@/pages/home/components/theme-toggle"

import SettingsButton from "@/pages/home/components/settings-button"

import AddGridItemButton from "@/pages/home/components/add-grid-item-button"

type HomePromptInputProps = {
  onSubmit?: (message: string) => void
}

export default function HomePromptInput({ onSubmit }: HomePromptInputProps) {
  const draft = usePromptStore((state) => state.draft)
  const setDraft = usePromptStore((state) => state.setDraft)

  function handleSubmit() {
    if (!draft.trim() || !onSubmit) return
    onSubmit(draft.trim())
    setDraft("")
  }

  return (
    <PromptInput
      value={draft}
      onValueChange={setDraft}
      onSubmit={handleSubmit}
      data-tour="search"
      className="mx-auto mt-6 w-full max-w-3xl shrink-0"
    >
      <PromptInputTextarea aria-label="对话输入" placeholder="搜索点什么…" />
      <PromptInputActions className="justify-end px-2 pb-2">
        <AddGridItemButton />
        <SettingsButton />
        <ThemeToggle />
        <SearchEngineSelect />
        <Button
          type="button"
          size="icon"
          aria-label="搜索"
          title="在新标签页搜索"
          disabled={!draft.trim() || !onSubmit}
          onClick={handleSubmit}
        >
          <ArrowUp />
        </Button>
      </PromptInputActions>
    </PromptInput>
  )
}
