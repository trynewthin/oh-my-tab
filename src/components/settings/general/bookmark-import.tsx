import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  readBrowserBookmarks,
  supportsBrowserBookmarks,
} from "@/lib/browser-bookmarks"
import { flushStorage } from "@/lib/storage"
import { rehydrateData } from "@/application/hydrate"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { toast } from "@/stores/toast-store"
import { settingsControlClassName } from "../shared/control-styles"
import SettingItem from "../shared/setting-item"

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
    <SettingItem
      label={t("settings.bookmarkImport.label")}
      description={
        supported
          ? t("settings.bookmarkImport.info")
          : t("settings.bookmarkImport.infoUnsupported")
      }
    >
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
    </SettingItem>
  )
}
