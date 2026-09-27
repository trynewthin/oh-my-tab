import { canSelectBrowserSearch, usePrivacyStore } from "@/stores/privacy-store"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { CaretDown, Check, Plus, Globe } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import EngineIcon from "@/components/search/engine-icon"
import { searchEngineLabel } from "@/lib/search-engines"
import { cn } from "@/lib/utils"
import { useSearchEngineStore } from "@/stores/search-engine-store"
import { runSystemAction } from "@/application/system-actions"

export default function SearchEngineSelect({
  inset,
}: {
  inset?: "flush" | "padded"
}) {
  const { t } = useTranslation()
  const available = canSelectBrowserSearch()
  const browserSearch =
    usePrivacyStore((state) => state.browserSearch) && available
  const [open, setOpen] = useState(false)
  const searchEngines = useSearchEngineStore((state) => state.engines)
  const searchEngine = useSearchEngineStore((state) => state.selectedId)
  const setSearchEngine = useSearchEngineStore((state) => state.selectEngine)
  const selectedEngine = browserSearch
    ? undefined
    : searchEngines.find((item) => item.id === searchEngine)
  const selectedName = selectedEngine
    ? searchEngineLabel(selectedEngine, (key) => t(key))
    : t("shell.engineSelect.browserDefault")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        data-tour="engine"
        render={
          <Button
            variant="ghost"
            size={inset ? "icon" : "default"}
            className={
              inset
                ? cn(
                    "size-10 rounded-full bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground aria-expanded:bg-transparent dark:hover:bg-transparent",
                    inset === "padded" && "ml-1.5"
                  )
                : undefined
            }
          />
        }
        aria-label={t("shell.engineSelect.triggerLabel", {
          name: selectedName,
        })}
        onClick={(event) => event.stopPropagation()}
      >
        <EngineIcon icon={selectedEngine?.icon} size={inset ? 20 : 16} />
        {!inset && (
          <>
            <span className="hidden max-w-32 truncate sm:inline">
              {selectedName}
            </span>
            <CaretDown className="size-3 text-muted-foreground" />
          </>
        )}
      </PopoverTrigger>
      <PopoverContent
        aria-label={t("shell.engineSelect.menuLabel")}
        align={inset ? "start" : "end"}
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
            {searchEngineLabel(engine, (key) => t(key))}
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
            {t("shell.engineSelect.browserDefault")}
            {browserSearch && <Check className="ml-auto" />}
          </Button>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => {
            setOpen(false)
            runSystemAction({ id: "open-settings", section: "search-engines" })
          }}
        >
          <Plus />
          {t("shell.engineSelect.custom")}
        </Button>
      </PopoverContent>
    </Popover>
  )
}
