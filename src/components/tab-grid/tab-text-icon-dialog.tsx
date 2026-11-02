import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ColorPicker from "@/components/ui/color-picker"
import SettingRange from "@/components/settings/shared/setting-range"
import { settingsControlClassName } from "@/components/settings/shared/control-styles"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"
import { createTextTabIcon, isSingleIconCharacter } from "@/lib/grid/tab-icon"
import { toast } from "@/stores/toast-store"

export default function TabTextIconDialog({
  contentClassName,
  overlayClassName,
  onClose,
  onConfirm,
}: {
  contentClassName?: string
  overlayClassName?: string
  onClose: () => void
  onConfirm: (icon: string) => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const [text, setText] = useState("")
  const [backgroundColor, setBackgroundColor] = useState("#334155")
  const [radius, setRadius] = useState(20)
  const [composing, setComposing] = useState(false)
  const [busy, setBusy] = useState(false)
  const valid = isSingleIconCharacter(text)
  const invalid = text.length > 0 && !composing && !valid

  async function create() {
    if (!valid || composing || busy) return
    setBusy(true)
    try {
      onConfirm(await createTextTabIcon(text, { backgroundColor, radius }))
      onClose()
    } catch {
      toast(t("grid.editor.textIconFailed"), "error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose()
      }}
    >
      <DialogContent
        className={`gap-4 p-5 sm:max-w-sm ${contentClassName ?? ""}`}
        overlayClassName={overlayClassName}
        showCloseButton={false}
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">
          {t("grid.editor.textIcon")}
        </DialogTitle>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void create()
          }}
        >
          <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-start gap-4">
            <div
              aria-hidden="true"
              className="flex size-20 items-center justify-center overflow-hidden text-[55px] leading-none font-bold text-white"
              style={{
                fontFamily: "sans-serif",
                backgroundColor,
                borderRadius: `${radius}%`,
              }}
            >
              {valid ? text : null}
            </div>
            <fieldset disabled={busy} className="grid min-w-0 gap-3">
              <div className="grid gap-1.5">
                <label htmlFor={id}>{t("grid.editor.textIconCharacter")}</label>
                <Input
                  id={id}
                  value={text}
                  autoComplete="off"
                  placeholder={t("grid.editor.textIconPlaceholder")}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? `${id}-error` : undefined}
                  onChange={(event) => setText(event.target.value)}
                  onCompositionStart={() => setComposing(true)}
                  onCompositionEnd={(event) => {
                    setText(event.currentTarget.value)
                    setComposing(false)
                  }}
                />
                {invalid && (
                  <p
                    id={`${id}-error`}
                    role="status"
                    className="text-xs text-destructive"
                  >
                    {t("grid.editor.textIconHint")}
                  </p>
                )}
              </div>
              <div className="grid gap-1.5">
                <span>{t("grid.editor.textIconBackground")}</span>
                <ColorPicker
                  value={backgroundColor}
                  onChange={setBackgroundColor}
                  label={t("grid.editor.textIconBackground")}
                  className={settingsControlClassName}
                  disabled={busy}
                  popoverLayer={110}
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor={`${id}-radius`}>
                  {t("grid.editor.textIconRadius")}
                </label>
                <SettingRange
                  id={`${id}-radius`}
                  label={t("grid.editor.textIconRadius")}
                  value={radius}
                  min={0}
                  max={50}
                  unit="%"
                  onChange={setRadius}
                />
              </div>
            </fieldset>
          </div>
          <DialogFooter className="flex-row justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              {t("grid.editor.cancel")}
            </Button>
            <Button type="submit" disabled={!valid || composing || busy}>
              {t(
                busy
                  ? "grid.editor.processingIcon"
                  : "grid.editor.createTextIcon"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
