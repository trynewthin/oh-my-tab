import { settingsControlClassName } from "../shared/control-styles"
import { useState } from "react"
import { Info } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  readBrowserBookmarks,
  supportsBrowserBookmarks,
} from "@/lib/browser-bookmarks"
import { flushStorage } from "@/lib/storage"
import { rehydrateData } from "@/lib/hydrate"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { toast } from "@/stores/toast-store"

export default function BookmarkImport() {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const supported = supportsBrowserBookmarks()
  async function importBookmarks() {
    if (busy) return
    setBusy(true)
    try {
      const parsed = await readBrowserBookmarks()
      if (!parsed.bookmarks.length && !parsed.invalid) {
        toast(t("settings.bookmarkImport.empty"), "info")
        return
      }
      await rehydrateData(["omt.tab-grid"])
      const result = useTabGridStore
        .getState()
        .importBookmarks(parsed.bookmarks)
      await flushStorage()
      toast(
        t("settings.bookmarkImport.success", {
          added: result.added,
          duplicates: result.duplicates,
          invalid: parsed.invalid,
        }),
        result.added ? "success" : "info"
      )
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : t("settings.bookmarkImport.failed"),
        "error"
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <div className="flex items-center gap-1">
          <span className="text-sm">{t("settings.bookmarkImport.label")}</span>
          <Popover>
            <PopoverTrigger
              openOnHover
              delay={150}
              closeDelay={100}
              aria-label={t("settings.bookmarkImport.infoAria")}
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="rounded-full text-muted-foreground"
                />
              }
            >
              <Info className="size-4" aria-hidden="true" />
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-64 rounded-xl p-3"
              aria-label={t("settings.bookmarkImport.infoAria")}
            >
              <PopoverDescription className="text-xs leading-5">
                {supported
                  ? t("settings.bookmarkImport.info")
                  : t("settings.bookmarkImport.infoUnsupported")}
              </PopoverDescription>
            </PopoverContent>
          </Popover>
        </div>
        <Button
          variant="outline"
          className={settingsControlClassName}
          disabled={busy || !supported}
          onClick={() => void importBookmarks()}
        >
          {busy
            ? t("settings.bookmarkImport.importing")
            : t("settings.bookmarkImport.import")}
        </Button>
      </div>
    </div>
  )
}
