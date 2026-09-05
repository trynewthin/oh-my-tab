import { useState } from "react"
import { CaretDown, Check, Plus } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import EngineIcon from "@/components/search/engine-icon"
import { useSearchEngineStore } from "@/stores/search-engine-store"
import { useSettingsStore } from "@/stores/settings-store"

export default function SearchEngineSelect() {
  const [open, setOpen] = useState(false)
  const searchEngines = useSearchEngineStore((state) => state.engines)
  const searchEngine = useSearchEngineStore((state) => state.selectedId)
  const setSearchEngine = useSearchEngineStore((state) => state.selectEngine)
  const openSettings = useSettingsStore((state) => state.openSettings)
  const selected = searchEngines.find((engine) => engine.id === searchEngine)!

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="ghost" />}
        aria-label={`搜索引擎：${selected.name}`}
        onClick={(event) => event.stopPropagation()}
      >
        <EngineIcon icon={selected.icon} />
        {selected.name}
        <CaretDown className="size-3 text-muted-foreground" />
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
            aria-pressed={engine.id === searchEngine}
            onClick={() => {
              setSearchEngine(engine.id)
              setOpen(false)
            }}
          >
            <EngineIcon icon={engine.icon} />
            {engine.name}
            {engine.id === searchEngine && <Check className="ml-auto" />}
          </Button>
        ))}
        <div className="my-1 border-t" />
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
