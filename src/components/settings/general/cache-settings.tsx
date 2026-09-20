import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { settingsControlClassName } from "../shared/control-styles"
import CacheDialog from "./cache-dialog"

export default function CacheSettings() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  return (
    <>
      <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <span className="text-sm">{t("settings.cache.title")}</span>
        <Button
          variant="outline"
          className={settingsControlClassName}
          onClick={() => setOpen(true)}
        >
          {t("settings.common.manage")}
        </Button>
      </div>
      <CacheDialog
        open={open}
        onOpenChange={setOpen}
        busy={busy}
        setBusy={setBusy}
      />
    </>
  )
}
