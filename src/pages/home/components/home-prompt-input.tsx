import MoreActions from "./more-actions"
import { useSearchSuggestions } from "@/components/search/use-search-suggestions"
import { useEffect, useId, useMemo, useRef, useState } from "react"
import { ArrowUp, Check, MagnifyingGlass } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  PromptInput,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input"
import { usePromptStore } from "@/stores/prompt-store"
import { useTabGridStore } from "@/stores/tab-grid-store"
import TabBackground from "@/components/tab-grid/tab-background"
import type { TabItem } from "@/components/tab-grid/types"
import SearchEngineSelect from "@/pages/home/components/search-engine-select"
import SettingsButton from "@/pages/home/components/settings-button"

type HomePromptInputProps = { onSubmit?: (message: string) => void }

export default function HomePromptInput({ onSubmit }: HomePromptInputProps) {
  const draft = usePromptStore((state) => state.draft)
  const setDraft = usePromptStore((state) => state.setDraft)
  const items = useTabGridStore((state) => state.items)
  const root = useRef<HTMLDivElement>(null)
  const listId = useId()
  const [focused, setFocused] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [active, setActive] = useState(-1)
  const [submitted, setSubmitted] = useState(false)
  const [composing, setComposing] = useState(false)
  const query = draft.trim()
  const suggestions = useSearchSuggestions(
    query,
    focused && !dismissed && !composing
  )
  const matches = useMemo(() => {
    if (!query) return []
    const needle = query.toLocaleLowerCase()
    const seen = new Set<string>()
    return items
      .flatMap((item): TabItem[] =>
        item.kind === "tab"
          ? [item]
          : item.tabs.map((tab) => ({
              ...tab,
              kind: "tab",
              size: tab.size ?? "small",
              color: tab.color ?? item.color,
            }))
      )
      .filter((tab) => {
        const match = `${tab.name} ${tab.url}`
          .toLocaleLowerCase()
          .includes(needle)
        if (!match || seen.has(tab.url)) return false
        seen.add(tab.url)
        return true
      })
      .slice(0, 6)
  }, [items, query])
  const words = suggestions.slice(0, 5)
  const optionCount = matches.length + words.length
  const expanded = focused && !dismissed && !composing && optionCount > 0
  const selected = expanded && active >= 0 && active < optionCount ? active : -1

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (
        event.key !== "/" ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey ||
        event.isComposing ||
        event.defaultPrevented
      )
        return
      if (
        target?.closest(
          "input, textarea, select, button, [contenteditable], [role='combobox']"
        ) ||
        document.querySelector(
          "[role='dialog'], [role='menu'], [data-slot='popover-content']"
        )
      )
        return
      event.preventDefault()
      root.current?.querySelector("textarea")?.focus()
    }
    window.addEventListener("keydown", shortcut)
    return () => window.removeEventListener("keydown", shortcut)
  }, [])

  useEffect(() => {
    if (!submitted) return
    const timer = window.setTimeout(() => setSubmitted(false), 1000)
    return () => window.clearTimeout(timer)
  }, [submitted])

  useEffect(() => {
    if (selected >= 0)
      document
        .getElementById(`${listId}-${selected}`)
        ?.scrollIntoView({ block: "nearest" })
  }, [selected, listId])

  function complete() {
    setDraft("")
    setActive(-1)
    setDismissed(true)
    setSubmitted(true)
  }

  function search() {
    if (!query || !onSubmit) return
    onSubmit(query)
    complete()
  }

  function choose(index: number) {
    const tab = matches[index]
    if (tab) {
      window.open(tab.url, "_blank", "noopener,noreferrer")
      complete()
    } else {
      const word = words[index - matches.length]
      if (word && onSubmit) {
        onSubmit(word)
        complete()
      }
    }
  }

  return (
    <div
      ref={root}
      className="relative z-20 mx-auto mt-6 w-full max-w-3xl shrink-0"
    >
      <PromptInput
        value={draft}
        onValueChange={(value) => {
          setDraft(value)
          setActive(-1)
          setDismissed(false)
          setSubmitted(false)
        }}
        onSubmit={() => (selected >= 0 ? choose(selected) : search())}
        data-tour="search"
      >
        <PromptInputTextarea
          aria-label="对话输入"
          placeholder="搜索点什么…"
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded={expanded}
          aria-controls={expanded ? listId : undefined}
          aria-activedescendant={
            selected >= 0 ? `${listId}-${selected}` : undefined
          }
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => {
            setComposing(false)
            setActive(-1)
          }}
          onFocus={() => {
            setFocused(true)
            setDismissed(false)
          }}
          onBlur={() => {
            setFocused(false)
            setActive(-1)
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault()
              setDismissed(true)
              setActive(-1)
            } else if (
              optionCount > 0 &&
              (event.key === "ArrowDown" || event.key === "ArrowUp")
            ) {
              event.preventDefault()
              setDismissed(false)
              const count = optionCount
              setActive(
                event.key === "ArrowDown"
                  ? (selected + 1) % count
                  : selected < 0
                    ? count - 1
                    : (selected + count - 1) % count
              )
            }
          }}
        />
        <PromptInputActions className="justify-end gap-1 px-2 pt-1 pb-1 sm:gap-2">
          <MoreActions />
          <div className="mr-auto">
            <SettingsButton />
          </div>
          <SearchEngineSelect />
          <Button
            type="button"
            size="icon"
            aria-label="搜索"
            title="在新标签页搜索"
            disabled={!query || !onSubmit}
            className="transition-[background-color,opacity,scale] duration-150 enabled:hover:scale-105 enabled:active:scale-95 motion-reduce:transform-none motion-reduce:transition-none"
            onClick={(event) => {
              event.stopPropagation()
              search()
            }}
          >
            {submitted ? <Check /> : <ArrowUp />}
          </Button>
        </PromptInputActions>
      </PromptInput>
      <span role="status" className="sr-only">
        {submitted ? "已在新标签页打开" : ""}
      </span>
      {expanded && (
        <div
          id={listId}
          role="listbox"
          aria-label="搜索建议"
          className="absolute top-full right-0 left-0 mt-2 max-h-[min(340px,45svh)] overflow-y-auto rounded-2xl border bg-popover p-1.5 text-popover-foreground shadow-lg"
          onMouseDown={(event) => event.preventDefault()}
        >
          {matches.length > 0 && (
            <div
              role="group"
              aria-label="匹配书签"
              className="grid auto-rows-[44px] grid-cols-1 gap-3 p-1.5 min-[480px]:grid-cols-2 min-[720px]:grid-cols-3"
            >
              {matches.map((tab, index) => (
                <div
                  key={tab.url}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-label={tab.name}
                  aria-selected={selected === index}
                  className={`relative isolate min-w-0 cursor-pointer rounded-2xl border outline-none hover:ring-2 hover:ring-foreground/15 ${tab.size === "medium" ? "row-span-2" : ""} ${selected === index ? "ring-2 ring-foreground/30" : ""}`}
                  onClick={() => choose(index)}
                >
                  <TabBackground item={tab} animated={!!tab.dynamicEffect} />
                  <span
                    className="relative z-10 flex h-full min-w-0 items-center rounded-[inherit] py-2 pr-16 pl-4"
                    title={tab.name}
                  >
                    <span className="truncate text-sm font-medium">
                      {tab.name}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
          {words.map((word, offset) => {
            const index = matches.length + offset
            return (
              <div
                key={word}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={selected === index}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ${selected === index ? "bg-muted" : "hover:bg-muted/60"}`}
                onClick={() => choose(index)}
              >
                <MagnifyingGlass className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm">{word}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
