import { useTranslation } from "react-i18next"

import { runSystemAction } from "@/application/system-actions"
import { systemActionRegistry } from "@/lib/system-actions"
import type { ButtonItem } from "@/lib/grid/types"
import { systemActionIcons } from "@/components/system-action-icons"
import { useSystemActionState } from "@/components/system-action-state"
import ComponentBackground from "./shared/component-background"

export default function ActionButton({
  item,
  preview = false,
}: {
  item: ButtonItem
  preview?: boolean
}) {
  const { t } = useTranslation()
  const Icon = systemActionIcons[item.action]
  const action = t(systemActionRegistry[item.action].labelKey)
  const { disabled, pressed } = useSystemActionState(item.action)
  const content = (
    <>
      <ComponentBackground color={item.color} animated={false} />
      <Icon className="relative z-10 size-6 text-foreground" />
    </>
  )

  if (preview)
    return (
      <div
        aria-label={action}
        className="relative flex size-full items-center justify-center overflow-hidden rounded-[inherit]"
      >
        {content}
      </div>
    )

  return (
    <button
      type="button"
      aria-label={action}
      title={action}
      aria-pressed={pressed}
      disabled={disabled}
      className="relative flex size-full items-center justify-center overflow-hidden rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      onClick={(event) => {
        event.stopPropagation()
        runSystemAction(item.action)
      }}
    >
      {content}
    </button>
  )
}
