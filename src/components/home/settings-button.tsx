import { GearSix } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"

import { runSystemAction } from "@/application/system-actions"
import { compactSearchButtonBackgroundClassName } from "@/components/search/search-surface-styles"
import { Button } from "@/components/ui/button"
import { surfaceShadowClassName } from "@/components/ui/surface-shadow"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

export default function SettingsButton({
  compact = false,
}: {
  compact?: boolean
}) {
  const { t } = useTranslation()
  const backgroundType = useHomeSettingsStore((state) => state.backgroundType)

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={
        compact
          ? `size-10 shrink-0 rounded-full border-border bg-clip-padding backdrop-blur-xl ${compactSearchButtonBackgroundClassName(backgroundType)} ${surfaceShadowClassName}`
          : undefined
      }
      data-tour="settings"
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
