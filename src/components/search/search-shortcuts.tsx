import { useTranslation } from "react-i18next"

import { runSystemAction } from "@/application/system-actions"
import MoreActions from "@/components/home/more-actions"
import SettingsButton from "@/components/home/settings-button"
import { useSystemActionState } from "@/components/system-action-state"
import { Button } from "@/components/ui/button"
import { surfaceShadowClassName } from "@/components/ui/surface-shadow"
import { systemActionRegistry, type SystemActionId } from "@/lib/system-actions"
import { searchShortcutGroups } from "@/lib/search-shortcuts"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { searchShortcutIcons } from "./search-shortcut-icons"
import { compactSearchButtonBackgroundClassName } from "./search-surface-styles"

function SystemShortcutButton({
  action,
  compact,
}: {
  action: SystemActionId
  compact: boolean
}) {
  const { t } = useTranslation()
  const backgroundType = useHomeSettingsStore((state) => state.backgroundType)
  const { disabled, pressed } = useSystemActionState(action)
  const Icon = searchShortcutIcons[action]
  const label = t(systemActionRegistry[action].labelKey)
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
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation()
        runSystemAction(action)
      }}
    >
      <Icon className="size-5" />
    </Button>
  )
}

export default function SearchShortcuts({ compact }: { compact: boolean }) {
  const config = useHomeSettingsStore((state) => state.searchShortcuts)
  if (!config.controls.length) return null
  const { hidden, visible } = searchShortcutGroups(config)
  return (
    <div
      className={
        compact
          ? "-mx-3 -my-3 flex max-w-[min(42vw,20rem)] min-w-0 [scrollbar-width:none] items-center gap-2 overflow-x-auto px-3 py-3 [&::-webkit-scrollbar]:hidden"
          : "mr-auto flex max-w-[45%] min-w-0 [scrollbar-width:none] items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden"
      }
    >
      {hidden.length > 0 && (
        <MoreActions
          compact={compact}
          actions={hidden.map((control) => control.action)}
        />
      )}
      {visible.map((control) =>
        control.action === "open-settings" ? (
          <SettingsButton key={control.id} compact={compact} />
        ) : (
          <SystemShortcutButton
            key={control.id}
            action={control.action}
            compact={compact}
          />
        )
      )}
    </div>
  )
}
