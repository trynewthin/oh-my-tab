import { useRef, type ComponentProps } from "react"
import { useVisualTransition } from "./use-visual-transition"

export default function MotionPresence({
  visible,
  direction = "top",
  onHidden,
  children,
  style,
  ...props
}: ComponentProps<"div"> & {
  visible: boolean
  direction?: "top" | "bottom"
  onHidden?: () => void
}) {
  const node = useRef<HTMLDivElement>(null)
  const sign = direction === "top" ? -1 : 1
  const { phase, initial } = useVisualTransition(visible, {
    appear: true,
    profile: "overlay",
    onHidden,
    onUpdate: (value) => {
      if (!node.current) return
      node.current.style.opacity = String(value)
      node.current.style.transform = `translateY(${sign * (1 - value) * (node.current.offsetHeight + 24)}px)`
    },
  })
  const present = visible || phase !== "hidden"
  return (
    <div
      {...props}
      ref={node}
      data-transition-phase={phase}
      inert={!visible}
      aria-hidden={!visible || undefined}
      style={{
        ...style,
        display: present ? style?.display : "none",
        opacity: initial,
      }}
    >
      {present && children}
    </div>
  )
}
