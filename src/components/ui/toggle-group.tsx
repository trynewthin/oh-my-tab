import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { cn } from "@/lib/utils"

function ToggleGroup({
  className,
  ...props
}: ToggleGroupPrimitive.Props) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      className={cn(
        "flex rounded-2xl border border-border bg-muted p-0.5",
        className
      )}
      {...props}
    />
  )
}

function ToggleGroupItem({
  className,
  ...props
}: TogglePrimitive.Props) {
  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      className={cn(
        "flex h-7 min-w-0 flex-1 items-center justify-center gap-1 rounded-xl px-1.5 text-xs font-medium text-muted-foreground transition-[background-color,color,box-shadow] outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm dark:aria-pressed:bg-input",
        className
      )}
      {...props}
    />
  )
}

export { ToggleGroup, ToggleGroupItem }
