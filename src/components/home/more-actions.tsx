import { useState } from "react"
import { useTranslation } from "react-i18next"
import { SquaresFour } from "@phosphor-icons/react"
import { runSystemAction } from "@/application/system-actions"
import { systemActionMenuIcons } from "@/components/system-action-icons"
import { useSystemActionState } from "@/components/system-action-state"
import { compactSearchButtonBackgroundClassName } from "@/components/search/search-surface-styles"
import { Button } from "@/components/ui/button"
import { surfaceShadowClassName } from "@/components/ui/surface-shadow"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  systemActionIdsFor,
  systemActionRegistry,
  type SystemActionId,
} from "@/lib/system-actions"
import { useGridSelectionStore } from "@/stores/grid-selection-store"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

const defaultMenuActions = systemActionIdsFor("more-actions")

function SystemMenuAction({
  action,
  onActivate,
}: {
  action: SystemActionId
  onActivate: () => void
}) {
  const { t } = useTranslation()
  const { disabled, pressed } = useSystemActionState(action)
  const Icon = systemActionMenuIcons[action]
  const definition = systemActionRegistry[action]
  const label = t(
    "menuLabelKey" in definition ? definition.menuLabelKey : definition.labelKey
  )
  return (
    <Button
      variant="ghost"
      className="w-full justify-start"
      disabled={disabled}
      aria-pressed={pressed}
      onClick={onActivate}
    >
      <Icon />
      {label}
      {pressed && "activeLabelKey" in definition && (
        <span className="ml-auto text-xs text-muted-foreground">
          {t(definition.activeLabelKey)}
        </span>
      )}
    </Button>
  )
}

export default function MoreActions({
  compact = false,
  actions,
}: {
  compact?: boolean
  actions?: readonly SystemActionId[]
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const backgroundType = useHomeSettingsStore((state) => state.backgroundType)
  const selecting = useGridSelectionStore((state) => state.active)
  const menuActions = actions ?? ["toggle-theme", ...defaultMenuActions]
  const uniqueMenuActions = [...new Set(menuActions)]
  return (
    <div
      className={compact ? "shrink-0" : undefined}
      onClick={(event) => event.stopPropagation()}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          data-tour="more"
          aria-label={t("shell.moreActions.trigger")}
          title={t("shell.moreActions.trigger")}
          render={
            <Button
              variant={
                selecting && menuActions.includes("toggle-selection")
                  ? "secondary"
                  : "ghost"
              }
              size="icon"
              className={
                compact
                  ? `size-10 rounded-full border-border bg-clip-padding backdrop-blur-xl ${compactSearchButtonBackgroundClassName(backgroundType)} ${surfaceShadowClassName}`
                  : undefined
              }
            />
          }
        >
          <SquaresFour className="size-5" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          aria-label={t("shell.moreActions.menuLabel")}
          className="w-56 gap-1 p-2"
        >
          {uniqueMenuActions.map((action) => (
            <SystemMenuAction
              key={action}
              action={action}
              onActivate={() => {
                setOpen(false)
                runSystemAction(action)
              }}
            />
          ))}
        </PopoverContent>
      </Popover>
    </div>
  )
}
