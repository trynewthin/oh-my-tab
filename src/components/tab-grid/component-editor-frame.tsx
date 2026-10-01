import {
  useLayoutEffect,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react"
import { useTranslation } from "react-i18next"
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
import {
  occupancyMark,
  type ComponentSizeDefinition,
} from "@/lib/grid/registry"
import { fitPreview } from "@/lib/preview-fit"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import "@/components/application/workspace.css"

function homeGridTrackWidth() {
  if (typeof document === "undefined") return 0
  return (
    document.querySelector("[data-tab-grid-track]")?.getBoundingClientRect()
      .width ?? 0
  )
}

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
  /** Kept for callers; the new split workspace never overlaps its preview. */
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
  const accentColor = useHomeSettingsStore((state) => state.color)
  const [stage, setStage] = useState<HTMLDivElement | null>(null)
  const [trackWidth, setTrackWidth] = useState(homeGridTrackWidth)
  const [room, setRoom] = useState({ width: 0, height: 0 })
  const geometry = resolveGridGeometry(
    trackWidth,
    wideGridColumns,
    narrowGridColumns
  )
  const box = gridOccupancyBox(geometry.trackWidth, width, height)
  const fitted = fitPreview(box, room, geometry.scale)

  useLayoutEffect(() => {
    const node = stage
    if (!open || !node) return
    const track = document.querySelector("[data-tab-grid-track]")
    const measure = () => {
      setTrackWidth(homeGridTrackWidth())
      const next = { width: node.clientWidth, height: node.clientHeight }
      setRoom((current) =>
        current.width === next.width && current.height === next.height
          ? current
          : next
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    if (track) observer.observe(track)
    window.addEventListener("resize", measure)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [open, stage])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!submitDisabled) onSubmit?.()
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
        className={`studio-editor ${contentClassName}`}
        style={{ "--workspace-accent": accentColor } as CSSProperties}
      >
        <header className="studio-editor-heading">
          <div>
            <DialogTitle className="studio-title">{title}</DialogTitle>
            <DialogDescription className="studio-description">
              {description}
            </DialogDescription>
          </div>
          <DialogClose
            render={
              <Button variant="ghost" size="icon" className="studio-close" />
            }
          >
            <CloseIcon />
            <span className="sr-only">{t("shell.common.close")}</span>
          </DialogClose>
        </header>
        <div className="studio-editor-layout">
          <div className="studio-preview-panel">
            <HomeSurface className="studio-preview-surface">
              <div ref={setStage} className="studio-preview-stage">
                <div
                  className="studio-preview-fit"
                  style={{ width: fitted.width, height: fitted.height }}
                >
                  <div
                    data-component-editor-preview
                    inert={previewInteractive ? undefined : true}
                    className={`studio-preview-widget ${previewBorder ? "border" : ""}`}
                    style={{
                      width: box.width,
                      height: box.height,
                      transform: `scale(${fitted.scale})`,
                    }}
                  >
                    {preview}
                  </div>
                </div>
              </div>
            </HomeSurface>
            <span className="studio-preview-size" aria-hidden="true">
              {occupancyMark(width, height)}
            </span>
          </div>
          <form className="studio-editor-form" onSubmit={submit}>
            <div className="studio-editor-fields">
              {children && <div className="studio-field-stack">{children}</div>}
              {sizeOptions.length > 0 && (
                <fieldset className="studio-size-field">
                  <legend>{t("grid.dialog.availableSizes")}</legend>
                  <div className="studio-size-options">
                    {sizeOptions.map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={size === option.value ? "default" : "outline"}
                        aria-pressed={size === option.value}
                        onClick={() => onSizeChange?.(option.value)}
                        className="studio-size-option"
                      >
                        {occupancyMark(option.width, option.height)}
                      </Button>
                    ))}
                  </div>
                </fieldset>
              )}
            </div>
            {onSubmit && (
              <footer className="studio-editor-actions">
                <Button type="button" variant="ghost" onClick={onClose}>
                  {cancelLabel ?? t("grid.editor.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={submitDisabled}
                  className="studio-submit"
                >
                  {submitLabel}
                </Button>
              </footer>
            )}
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
