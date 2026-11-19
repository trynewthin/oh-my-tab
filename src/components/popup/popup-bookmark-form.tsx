import { useId } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export default function PopupBookmarkForm({
  name,
  url,
  submitLabel,
  onNameChange,
  onUrlChange,
  onSave,
  fieldsDisabled,
  submitDisabled,
  success,
  error,
}: {
  name: string
  url: string
  submitLabel: string
  onNameChange?: (value: string) => void
  onUrlChange?: (value: string) => void
  onSave?: () => void
  fieldsDisabled?: boolean
  submitDisabled?: boolean
  success?: boolean
  error?: string
}) {
  const { t } = useTranslation()
  const id = useId()

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSave?.()
      }}
    >
      <div className="space-y-3">
        <label htmlFor={`${id}-name`} className="block text-sm">
          {t("shell.popup.nameLabel")}
        </label>
        <Input
          id={`${id}-name`}
          className="border-border bg-popover dark:bg-popover"
          value={name}
          disabled={fieldsDisabled}
          readOnly={!onNameChange}
          maxLength={120}
          onChange={(event) => onNameChange?.(event.target.value)}
        />
      </div>
      <div className="space-y-3">
        <label htmlFor={`${id}-url`} className="block text-sm">
          {t("shell.popup.urlLabel")}
        </label>
        <Input
          id={`${id}-url`}
          className="border-border bg-popover dark:bg-popover"
          value={url}
          disabled={fieldsDisabled}
          readOnly={!onUrlChange}
          placeholder="https://"
          onChange={(event) => onUrlChange?.(event.target.value)}
        />
      </div>
      <Button
        type="submit"
        className={cn(
          "w-full border-border",
          success && "bg-emerald-600 text-white disabled:opacity-100"
        )}
        disabled={submitDisabled}
        aria-live="polite"
      >
        {submitLabel}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}
