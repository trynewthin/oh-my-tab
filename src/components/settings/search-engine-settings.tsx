import { useState } from "react"
import { Check, PencilSimple, Plus, Trash } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import EngineIcon from "@/components/search/engine-icon"
import {
  defaultSearchEngines,
  isPresetEngine,
  type SearchEngine,
} from "@/lib/search-engines"
import { useSearchEngineStore } from "@/stores/search-engine-store"

import SearchEngineForm from "@/components/settings/search-engine-form"
import AddSearchEngineDialog from "@/components/settings/add-search-engine-dialog"

import DeleteSearchEngineDialog from "@/components/settings/delete-search-engine-dialog"

export default function SearchEngineSettings() {
  const engines = useSearchEngineStore((state) => state.engines)
  const selectedId = useSearchEngineStore((state) => state.selectedId)
  const selectEngine = useSearchEngineStore((state) => state.selectEngine)
  const removeEngine = useSearchEngineStore((state) => state.removeEngine)
  const addPreset = useSearchEngineStore((state) => state.addPreset)
  const [deleting, setDeleting] = useState<SearchEngine | null>(null)
  const [editing, setEditing] = useState<SearchEngine | null>(null)

  return (
    <section className="space-y-5" aria-labelledby="search-settings-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="search-settings-title" className="text-base font-medium">
            搜索引擎
          </h2>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            setEditing({ id: crypto.randomUUID(), name: "", url: "" })
          }
        >
          <Plus />
          添加
        </Button>
      </div>
      <div className="min-h-14 divide-y rounded-2xl border">
        {engines.map((engine) => (
          <div key={engine.id} className="flex items-center gap-3 p-3">
            <EngineIcon icon={engine.icon} />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {engine.name}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant={selectedId === engine.id ? "secondary" : "ghost"}
                size="icon-sm"
                aria-label={`使用 ${engine.name}`}
                aria-pressed={selectedId === engine.id}
                onClick={() => selectEngine(engine.id)}
              >
                <Check />
              </Button>
              {!isPresetEngine(engine.id) && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`编辑 ${engine.name}`}
                  onClick={() => setEditing(engine)}
                >
                  <PencilSimple />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`${isPresetEngine(engine.id) ? "移除" : "删除"} ${engine.name}`}
                disabled={engines.length === 1}
                onClick={() => setDeleting(engine)}
              >
                <Trash />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <section className="space-y-3" aria-labelledby="preset-engines-title">
        <h3 id="preset-engines-title" className="text-sm font-medium">
          预设
        </h3>
        <div className="flex flex-wrap gap-2">
          {defaultSearchEngines.map((engine) => {
            const enrolled = engines.some((item) => item.id === engine.id)
            return (
              <Badge
                key={engine.id}
                variant={enrolled ? "secondary" : "outline"}
                className="h-8 gap-2 px-3 disabled:cursor-default disabled:opacity-50"
                render={<button type="button" disabled={enrolled} />}
                aria-label={`加入 ${engine.name}`}
                onClick={() => addPreset(engine.id)}
              >
                <EngineIcon icon={engine.icon} />
                {engine.name}
              </Badge>
            )
          })}
        </div>
      </section>
      {deleting && (
        <DeleteSearchEngineDialog
          engine={deleting}
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            removeEngine(deleting.id)
            if (editing?.id === deleting.id) setEditing(null)
            setDeleting(null)
          }}
        />
      )}
      {editing &&
        (editing.name ? (
          <SearchEngineForm
            key={editing.id}
            engine={editing}
            onClose={() => setEditing(null)}
          />
        ) : (
          <AddSearchEngineDialog
            key={editing.id}
            engine={editing}
            onClose={() => setEditing(null)}
          />
        ))}
    </section>
  )
}
