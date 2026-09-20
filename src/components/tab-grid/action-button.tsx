import {
  Checks,
  CircleHalf,
  Gear,
  GridFour,
  SquaresFour,
  type Icon,
} from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"

import { runSystemAction } from "@/application/system-actions"
import { buttonActionLabelKeys } from "@/lib/grid/button-actions"
import type { ButtonAction, ButtonItem } from "@/lib/grid/types"
import ComponentBackground from "./shared/component-background"

const buttonActionIcons = {
  "toggle-theme": CircleHalf,
  "tidy-grid": GridFour,
  "toggle-selection": Checks,
  "open-settings": Gear,
  "open-components": SquaresFour,
} as const satisfies Record<ButtonAction, Icon>

export default function ActionButton({
  item,
  preview = false,
}: {
  item: ButtonItem
  preview?: boolean
}) {
  const { t } = useTranslation()
  const Icon = buttonActionIcons[item.action]
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
