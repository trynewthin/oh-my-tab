import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import SettingItem from "../shared/setting-item"
import { settingsControlClassName } from "../shared/control-styles"
import CacheDialog from "./cache-dialog"

export default function CacheSettings() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  return (
    <>
      <SettingItem label={t("settings.cache.title")}>
        <Button
          variant="outline"
          className={settingsControlClassName}
          onClick={() => setOpen(true)}
        >
          {t("settings.common.manage")}
        </Button>
      </SettingItem>
      <CacheDialog
        open={open}
        onOpenChange={setOpen}
        busy={busy}
        setBusy={setBusy}
      />
    </>
  )
}
