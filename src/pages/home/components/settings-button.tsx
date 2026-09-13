import { GearSix } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { useSettingsStore } from "@/stores/settings-store"

export default function SettingsButton({
  compact = false,
}: {
  compact?: boolean
}) {
  const setOpen = useSettingsStore((state) => state.setOpen)

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={
        compact
          ? "size-10 rounded-full border-border bg-card/70 bg-clip-padding backdrop-blur-xl"
          : undefined
      }
      data-tour="settings"
      aria-label="打开设置"
      title="设置"
      onClick={(event) => {
        event.stopPropagation()
        setOpen(true)
      }}
    >
      <GearSix className="size-5" />
    </Button>
  )
}
