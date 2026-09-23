import { useTranslation } from "react-i18next"

import { runSystemAction } from "@/application/system-actions"
import { buttonActionLabelKeys } from "@/lib/grid/button-actions"
import type { ButtonItem } from "@/lib/grid/types"
import { systemActionIcons } from "@/components/system-action-icons"
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
  const action = t(
    `grid.editor.buttonActions.${buttonActionLabelKeys[item.action]}`
  )
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
      className="relative flex size-full items-center justify-center overflow-hidden rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={(event) => {
        event.stopPropagation()
        runSystemAction(item.action)
      }}
    >
      {content}
    </button>
  )
}
