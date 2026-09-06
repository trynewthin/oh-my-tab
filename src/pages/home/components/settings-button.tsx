import { GearSix } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { useSettingsStore } from "@/stores/settings-store"

export default function SettingsButton() {
  const setOpen = useSettingsStore((state) => state.setOpen)

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      data-tour="settings"
      aria-label="打开设置"
      title="设置"
      onClick={(event) => {
        event.stopPropagation()
        setOpen(true)
      }}
    >
      <GearSix />
    </Button>
  )
}
