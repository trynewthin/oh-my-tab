import ComponentBackground from "../shared/component-background"
import { getComponentSize, occupancyMark } from "@/lib/grid/registry"
import type { TemplateItem } from "@/lib/grid/types"

export default function TemplateTile({
  item,
}: {
  item: TemplateItem
  preview?: boolean
}) {
  const size = getComponentSize(item.kind, item.size)

  return (
    <div
      className="relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden rounded-[inherit]"
      aria-label={item.name}
    >
      <ComponentBackground color={item.color} animated={!!item.dynamicEffect} />
      <span className="relative z-10 px-1 text-center text-[13px] font-medium text-muted-foreground tabular-nums sm:text-sm">
        {size ? occupancyMark(size.width, size.height) : item.name}
      </span>
    </div>
  )
}
