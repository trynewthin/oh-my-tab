import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { Check } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary-foreground outline-none transition-colors data-checked:border-primary data-checked:bg-primary focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex data-unchecked:hidden">
        <Check className="size-3" weight="bold" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
