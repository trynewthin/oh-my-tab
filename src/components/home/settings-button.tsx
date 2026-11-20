import { GearSix } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"

import { runSystemAction } from "@/application/system-actions"
import { compactSearchButtonClassName } from "@/components/search/search-surface-styles"
import { Button } from "@/components/ui/button"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

export default function SettingsButton({
  compact = false,
  preview = false,
}: {
  compact?: boolean
  preview?: boolean
}) {
  const { t } = useTranslation()
  const backgroundType = useHomeSettingsStore((state) => state.backgroundType)

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={
        compact ? compactSearchButtonClassName(backgroundType) : undefined
      }
      data-tour={preview ? undefined : "settings"}
      aria-label={t("shell.settingsButton.open")}
      title={t("shell.settingsButton.title")}
      onClick={(event) => {
        event.stopPropagation()
        runSystemAction("open-settings")
      }}
    >
      <GearSix className="size-5" />
    </Button>
  )
}
