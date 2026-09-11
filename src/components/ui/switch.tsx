import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "@/lib/utils"

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border border-border bg-muted p-0.5 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-[18px] rounded-full bg-background shadow-sm transition-transform data-checked:translate-x-4" />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
