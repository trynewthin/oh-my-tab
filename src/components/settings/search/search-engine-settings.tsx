import { canSelectBrowserSearch, usePrivacyStore } from "@/stores/privacy-store"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, PencilSimple, Plus, Trash } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { ApplicationHeaderActions } from "@/components/application/application-dialog"
import { Badge } from "@/components/ui/badge"
import EngineIcon from "@/components/search/engine-icon"
import {
  defaultSearchEngines,
  isPresetEngine,
  searchEngineLabel,
  type SearchEngine,
} from "@/lib/search-engines"
import { useSearchEngineStore } from "@/stores/search-engine-store"

import SearchEngineForm from "./search-engine-form"
import AddSearchEngineDialog from "./add-search-engine-dialog"

import DeleteSearchEngineDialog from "./delete-search-engine-dialog"

export default function SearchEngineSettings() {
  const { t } = useTranslation()
  const available = canSelectBrowserSearch()
  const browserSearch =
    usePrivacyStore((state) => state.browserSearch) && available
  const engines = useSearchEngineStore((state) => state.engines)
  const selectedId = useSearchEngineStore((state) => state.selectedId)
  const selectEngine = useSearchEngineStore((state) => state.selectEngine)
  const removeEngine = useSearchEngineStore((state) => state.removeEngine)
  const addPreset = useSearchEngineStore((state) => state.addPreset)
  const [deleting, setDeleting] = useState<SearchEngine | null>(null)
  const [editing, setEditing] = useState<SearchEngine | null>(null)

  return (
    <section className="space-y-5">
      <div className="hidden justify-end sm:flex">
        <ApplicationHeaderActions>
          <Button
            variant="outline"
            onClick={() =>
              setEditing({ id: crypto.randomUUID(), name: "", url: "" })
            }
          >
            <Plus />
            {t("settings.searchEngines.add")}
          </Button>
        </ApplicationHeaderActions>
      </div>
      <div className="min-h-14 divide-y rounded-2xl border">
        {engines.map((engine) => (
          <div key={engine.id} className="flex items-center gap-3 p-3">
            <EngineIcon icon={engine.icon} />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {searchEngineLabel(engine, t)}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant={
                  !browserSearch && selectedId === engine.id
                    ? "secondary"
                    : "ghost"
                }
                size="icon-sm"
                aria-label={t("settings.searchEngines.useAria", {
                  name: searchEngineLabel(engine, t),
                })}
                aria-pressed={!browserSearch && selectedId === engine.id}
                onClick={() => selectEngine(engine.id)}
              >
                <Check />
              </Button>
              {!isPresetEngine(engine.id) && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("settings.searchEngines.editAria", {
                    name: searchEngineLabel(engine, t),
                  })}
                  onClick={() => setEditing(engine)}
                >
                  <PencilSimple />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t(
                  isPresetEngine(engine.id)
                    ? "settings.searchEngines.removeAria"
                    : "settings.searchEngines.deleteAria",
                  { name: searchEngineLabel(engine, t) }
                )}
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
          {t("settings.searchEngines.presets")}
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
                aria-label={t("settings.searchEngines.addPresetAria", {
                  name: searchEngineLabel(engine, t),
                })}
                onClick={() => addPreset(engine.id)}
              >
                <EngineIcon icon={engine.icon} />
                {searchEngineLabel(engine, t)}
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
