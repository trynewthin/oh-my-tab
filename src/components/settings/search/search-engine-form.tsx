import { toast } from "@/stores/toast-store"
import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { isSearchUrl, type SearchEngine } from "@/lib/search-engines"
import { useSearchEngineStore } from "@/stores/search-engine-store"

export default function SearchEngineForm({
  engine,
  onClose,
  inDialog = false,
}: {
  engine: SearchEngine
  onClose: () => void
  inDialog?: boolean
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(engine.name)
  const [url, setUrl] = useState(engine.url)
  const saveEngine = useSearchEngineStore((state) => state.saveEngine)

  function save(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || !isSearchUrl(url.trim())) {
      toast(t("settings.searchEngines.invalid"), "error")
      return
    }
    saveEngine({ ...engine, name: name.trim(), url: url.trim() })
    onClose()
  }

  return (
    <form
      className={inDialog ? "space-y-4" : "space-y-4 rounded-2xl border p-4"}
      onSubmit={save}
    >
      {!inDialog && (
        <h3 className="text-sm font-medium">
          {engine.name
            ? t("settings.searchEngines.editTitle")
            : t("settings.searchEngines.addTitle")}
        </h3>
      )}
      <label className="grid gap-2 text-sm">
        {t("settings.searchEngines.name")}
        <Input
          autoFocus
          required
          maxLength={40}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("settings.searchEngines.namePlaceholder")}
        />
      </label>
      <label className="grid gap-2 text-sm">
        {t("settings.searchEngines.url")}
        <Input
          required
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://duckduckgo.com/?q={query}"
          aria-describedby="search-url-hint"
        />
      </label>
      <p id="search-url-hint" className="text-xs text-muted-foreground">
        {t("settings.searchEngines.urlHint")}
      </p>

      {inDialog ? (
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("settings.common.cancel")}
          </Button>
          <Button type="submit">{t("settings.common.save")}</Button>
        </DialogFooter>
      ) : (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("settings.common.cancel")}
          </Button>
          <Button type="submit">{t("settings.common.save")}</Button>
        </div>
      )}
    </form>
  )
}
