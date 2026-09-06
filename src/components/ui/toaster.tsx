import MotionPresence from "@/components/effects/motion-presence"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "@phosphor-icons/react"
import EffectSurface from "@/components/effects/effect-surface"
import { Button } from "@/components/ui/button"
import { useToastStore, type ToastMessage } from "@/stores/toast-store"

function ToastCard({ item }: { item: ToastMessage }) {
  const color = useHomeSettingsStore((state) => state.color)
  const dismiss = useToastStore((state) => state.dismiss)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    if (hovered || focused || item.dismissed) return
    const timer = window.setTimeout(
      () => dismiss(item.id),
      item.action || item.kind === "error" ? 12000 : 6000
    )
    return () => window.clearTimeout(timer)
  }, [
    item.id,
    item.kind,
    item.action,
    item.dismissed,
    hovered,
    focused,
    dismiss,
  ])
  return (
    <MotionPresence
      visible={!item.dismissed}
      direction="top"
      onHidden={() => useToastStore.getState().remove(item.id)}
      className="relative isolate min-h-11 shrink-0 rounded-2xl border shadow-lg"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false)
      }}
    >
      <EffectSurface color={color} textureId={item.id} animated />
      <div className="relative z-10 flex min-h-11 items-center gap-3 py-2 pr-3 pl-4">
        <p
          role={item.kind === "error" ? "alert" : "status"}
          className="min-w-0 flex-1 text-sm font-medium break-words"
        >
          {item.message}
        </p>
        {item.action ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              dismiss(item.id)
              item.action?.run()
            }}
          >
            {item.action.label}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="关闭通知"
            onClick={() => dismiss(item.id)}
          >
            <X />
          </Button>
        )}
      </div>
    </MotionPresence>
  )
}
export default function Toaster() {
  const messages = useToastStore((state) => state.messages)
  return createPortal(
    <section
      aria-label="操作通知"
      aria-live="polite"
      aria-relevant="additions text"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] mx-auto flex max-h-[55svh] w-auto max-w-[432px] [scrollbar-width:none] flex-col gap-2 overflow-y-auto px-6 pt-6 pb-10 [&>*]:pointer-events-auto"
    >
      {messages.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </section>,
    document.body
  )
}
