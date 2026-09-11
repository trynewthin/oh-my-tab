import { canSelectBrowserSearch, usePrivacyStore } from "@/stores/privacy-store"
import { useState } from "react"
import { CaretDown, Check, Plus, Globe } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import EngineIcon from "@/components/search/engine-icon"
import { useSearchEngineStore } from "@/stores/search-engine-store"
import { useSettingsStore } from "@/stores/settings-store"

export default function SearchEngineSelect({
  compact = false,
}: {
  compact?: boolean
}) {
  const available = canSelectBrowserSearch()
  const browserSearch =
    usePrivacyStore((state) => state.browserSearch) && available
  const [open, setOpen] = useState(false)
  const searchEngines = useSearchEngineStore((state) => state.engines)
  const searchEngine = useSearchEngineStore((state) => state.selectedId)
  const setSearchEngine = useSearchEngineStore((state) => state.selectEngine)
  const openSettings = useSettingsStore((state) => state.openSettings)
  const selected = browserSearch
    ? { name: "浏览器默认", icon: undefined }
    : searchEngines.find((engine) => engine.id === searchEngine)!

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        data-tour="engine"
        render={
          <Button
            variant="ghost"
            size={compact ? "icon" : "default"}
            className={
              compact
                ? "size-10 rounded-full border-border/60 bg-card/70 shadow-xs backdrop-blur-xl"
                : undefined
            }
          />
        }
        aria-label={`搜索引擎：${selected.name}`}
        onClick={(event) => event.stopPropagation()}
      >
        <EngineIcon icon={selected.icon} />
        {!compact && (
          <>
            <span className="hidden max-w-32 truncate sm:inline">
              {selected.name}
            </span>
            <CaretDown className="size-3 text-muted-foreground" />
          </>
        )}
      </PopoverTrigger>
      <PopoverContent
        aria-label="选择搜索引擎"
        align="end"
        className="w-48 gap-1 p-2"
        onClick={(event) => event.stopPropagation()}
      >
        {searchEngines.map((engine) => (
          <Button
            key={engine.id}
            variant="ghost"
            className="w-full justify-start"
            aria-pressed={!browserSearch && engine.id === searchEngine}
            onClick={() => {
              usePrivacyStore.getState().setBrowserSearch(false)
              setSearchEngine(engine.id)
              setOpen(false)
            }}
          >
            <EngineIcon icon={engine.icon} />
            {engine.name}
            {!browserSearch && engine.id === searchEngine && (
              <Check className="ml-auto" />
            )}
          </Button>
        ))}
        <div className="my-1 border-t" />
        {available && (
          <Button
            variant="ghost"
            className="w-full justify-start"
            aria-pressed={browserSearch}
            onClick={() => {
              usePrivacyStore.getState().setBrowserSearch(true)
              setOpen(false)
            }}
          >
            <Globe />
            浏览器默认{browserSearch && <Check className="ml-auto" />}
          </Button>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => {
            setOpen(false)
            openSettings("search-engines")
          }}
        >
          <Plus />
          自定义搜索引擎
        </Button>
      </PopoverContent>
    </Popover>
  )
}
