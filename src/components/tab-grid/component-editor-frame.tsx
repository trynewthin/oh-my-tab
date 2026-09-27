import {
  useLayoutEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"
import { Button } from "@/components/ui/button"
import CloseIcon from "@/components/ui/close-icon"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import HomeSurface from "@/components/home/home-surface"
import { gridOccupancyBox, resolveGridGeometry } from "@/lib/grid/grid-layout"
import { cn } from "@/lib/utils"
import {
  occupancyMark,
  type ComponentSizeDefinition,
} from "@/lib/grid/registry"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useTranslation } from "react-i18next"

function homeGridTrackWidth() {
  return (
    document.querySelector("[data-tab-grid-track]")?.getBoundingClientRect()
      .width ?? 0
  )
}

const PREVIEW_SIDE_INSET = 48
const PREVIEW_TOP_INSET = 56
const PREVIEW_BOTTOM_INSET = 24
const MAX_PANEL_OVERLAP = 80

// The preview uses the home grid's tile size. Large tiles can extend behind
// the floating form, while smaller tiles stay centered above it.
export default function ComponentEditorFrame({
  open = true,
  contentClassName = "",
  overlayClassName,
  title,
  description,
  width,
  height,
  preview,
  previewBorder = true,
  previewInteractive = false,
  previewOverlap = true,
  sizeOptions = [],
  size,
  onSizeChange,
  submitLabel,
  submitDisabled = false,
  cancelLabel,
  onSubmit,
  onClose,
  children,
}: {
  open?: boolean
  contentClassName?: string
  overlayClassName?: string
  title: string
  description: string
  width: number
  height: number
  preview: ReactNode
  previewBorder?: boolean
  previewInteractive?: boolean
  previewOverlap?: boolean
  sizeOptions?: readonly ComponentSizeDefinition[]
  size?: string
  onSizeChange?: (size: string) => void
  submitLabel?: string
  submitDisabled?: boolean
  cancelLabel?: string
  onSubmit?: () => void
  onClose: () => void
  children?: ReactNode
}) {
  const { t } = useTranslation()
  const wideGridColumns = useHomeSettingsStore((state) => state.wideGridColumns)
  const narrowGridColumns = useHomeSettingsStore(
    (state) => state.narrowGridColumns
  )
  const [dialog, setDialog] = useState<HTMLDivElement | null>(null)
  const [panel, setPanel] = useState<HTMLFormElement | null>(null)
  const [trackWidth, setTrackWidth] = useState(homeGridTrackWidth)
  const [room, setRoom] = useState({ width: 0, height: 0, panelTop: 0 })
  const geometry = resolveGridGeometry(
    trackWidth,
    wideGridColumns,
    narrowGridColumns
  )
  const box = gridOccupancyBox(geometry.trackWidth, width, height)
  const visualWidth = box.width * geometry.scale
  const visualHeight = box.height * geometry.scale
  const overlap = previewOverlap
    ? Math.min(MAX_PANEL_OVERLAP, Math.max(0, room.height - room.panelTop))
    : 0
  const previewAreaBottom =
    room.panelTop - (previewOverlap ? 0 : PREVIEW_BOTTOM_INSET)
  const previewHeight = Math.max(
    64,
    Math.min(
      room.height - PREVIEW_TOP_INSET - PREVIEW_BOTTOM_INSET,
      previewAreaBottom - PREVIEW_TOP_INSET + overlap
    )
  )
  const fit =
    room.width > 0 && room.height > 0 && room.panelTop > 0
      ? Math.min(
          1,
          Math.max(64, room.width - PREVIEW_SIDE_INSET * 2) / visualWidth,
          previewHeight / visualHeight
        )
      : Math.min(1, 400 / visualWidth, 280 / visualHeight)
  // The home grid transforms the whole tile, so its contents need this scale too.
  const scale = geometry.scale * fit
  const scaledHeight = box.height * scale
  const previewTop =
    room.panelTop > 0
      ? PREVIEW_TOP_INSET +
        Math.max(0, (previewAreaBottom - PREVIEW_TOP_INSET - scaledHeight) / 2)
      : PREVIEW_TOP_INSET

  useLayoutEffect(() => {
    const measureTrack = () => setTrackWidth(homeGridTrackWidth())
    measureTrack()
    window.addEventListener("resize", measureTrack)
    return () => window.removeEventListener("resize", measureTrack)
  }, [])

  useLayoutEffect(() => {
    if (!dialog || !panel) return
    const measureRoom = () => {
      const next = {
        width: dialog.clientWidth,
        height: dialog.clientHeight,
        panelTop: panel.offsetTop,
      }
      setRoom((current) =>
        current.width === next.width &&
        current.height === next.height &&
        current.panelTop === next.panelTop
          ? current
          : next
      )
    }
    measureRoom()
    const observer = new ResizeObserver(measureRoom)
    observer.observe(dialog)
    observer.observe(panel)
    window.addEventListener("resize", measureRoom)
    return () => {
      window.removeEventListener("resize", measureRoom)
      observer.disconnect()
    }
  }, [dialog, panel])

  function submit(event: FormEvent) {
    event.preventDefault()
    onSubmit?.()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        overlayClassName={overlayClassName}
        className={`h-[36rem] max-h-[calc(100svh-2rem)] overflow-hidden bg-transparent p-0 sm:max-w-xl ${contentClassName}`}
      >
        <div ref={setDialog} className="absolute inset-0">
          <HomeSurface className="absolute inset-0" />
          <div
            className={`absolute inset-0 z-0 ${previewInteractive ? "" : "pointer-events-none"}`}
          >
            <div
              className="absolute left-1/2"
              style={{
                top: previewTop,
                width: box.width * scale,
                height: scaledHeight,
                transform: "translateX(-50%)",
              }}
            >
              <div
                data-component-editor-preview
                inert={previewInteractive ? undefined : true}
                className={`absolute top-0 left-0 isolate origin-top-left overflow-hidden rounded-2xl ${previewBorder ? "border" : ""}`}
                style={{
                  width: box.width,
                  height: box.height,
                  transform: `scale(${scale})`,
                }}
              >
                {preview}
              </div>
            </div>
          </div>
          <DialogClose
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute top-3 right-3 z-20 text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
              />
            }
          >
            <CloseIcon />
            <span className="sr-only">{t("shell.common.close")}</span>
          </DialogClose>
          <form
            ref={setPanel}
            className="absolute right-3 bottom-3 left-3 z-10 max-h-[50%] overflow-y-auto rounded-2xl border border-black/10 bg-white/80 p-4 text-zinc-950 shadow-lg backdrop-blur-md sm:right-4 sm:bottom-4 sm:left-4 dark:border-white/10 dark:bg-zinc-900/80 dark:text-white"
            onSubmit={submit}
          >
            <DialogTitle className="sr-only">{title}</DialogTitle>
            <DialogDescription className="sr-only">
              {description}
            </DialogDescription>
            {children && <div className="space-y-3">{children}</div>}
            {(sizeOptions.length > 0 || onSubmit) && (
              <div
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3",
                  children && "mt-4"
                )}
              >
                {sizeOptions.length > 0 ? (
                  <div
                    role="group"
                    aria-label={t("grid.dialog.availableSizes")}
                    className="flex min-w-0 items-center gap-2 overflow-x-auto py-1"
                  >
                    {sizeOptions.map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        className="shrink-0"
                        variant={size === option.value ? "default" : "outline"}
                        aria-pressed={size === option.value}
                        onClick={() => onSizeChange?.(option.value)}
                      >
                        {occupancyMark(option.width, option.height)}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <span />
                )}
                {onSubmit && (
                  <div className="flex shrink-0 items-center gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>
                      {cancelLabel ?? t("grid.editor.cancel")}
                    </Button>
                    <Button type="submit" disabled={submitDisabled}>
                      {submitLabel}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
