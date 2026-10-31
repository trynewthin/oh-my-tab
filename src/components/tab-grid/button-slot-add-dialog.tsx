import { useId, useState, type FormEvent } from "react"
import { Globe, Lightning } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import SettingItem from "@/components/settings/shared/setting-item"
import { buttonSlotCapacity } from "@/lib/grid/button-slot"
import {
  normalizeTabUrl,
  type ButtonSlotControl,
  type ButtonSlotItem,
} from "@/lib/grid/types"
import {
  isActiveSystemAction,
  isSystemActionOnSurface,
  systemActionIdsFor,
  systemActionRegistry,
  type SystemActionId,
} from "@/lib/system-actions"
import { addButtonSlotControl } from "@/stores/widget-actions"

const actions = systemActionIdsFor("quick-bar")

export default function ButtonSlotAddDialog({
  item,
  onClose,
  returnFocus,
}: {
  item: ButtonSlotItem
  onClose: () => void
  returnFocus: HTMLElement | null
}) {
  const { t } = useTranslation()
  const id = useId()
  const [kind, setKind] = useState<"system" | "site" | null>(null)
  const [action, setAction] = useState<SystemActionId>(actions[0])
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [error, setError] = useState<"site" | "full" | null>(null)
  const full = item.controls.length >= buttonSlotCapacity(item.size)

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!kind) return
    const address = normalizeTabUrl(url)
    if (kind === "site" && (!name.trim() || !address)) {
      setError("site")
      return
    }
    const control: ButtonSlotControl =
      kind === "system"
        ? { id: crypto.randomUUID(), kind, action }
        : { id: crypto.randomUUID(), kind, name: name.trim(), url: address! }
    if (addButtonSlotControl(item.id, control)) onClose()
    else setError("full")
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        className="max-h-[calc(100svh-2rem)] overflow-y-auto"
        finalFocus={() => {
          if (returnFocus?.isConnected)
            returnFocus.focus({ preventScroll: true })
          return false
        }}
      >
        <DialogHeader>
          <DialogTitle>{t("grid.buttonSlot.add")}</DialogTitle>
          <DialogDescription>
            {t("grid.buttonSlot.chooseType")}
          </DialogDescription>
        </DialogHeader>
        {kind === null ? (
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-24 flex-col gap-2 rounded-2xl"
              onClick={() => setKind("system")}
            >
              <Lightning className="size-6" />
              {t("settings.home.quickBarTabSystem")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-24 flex-col gap-2 rounded-2xl"
              onClick={() => setKind("site")}
            >
              <Globe className="size-6" />
              {t("settings.home.quickBarTabSite")}
            </Button>
          </div>
        ) : (
          <form className="grid gap-4" onSubmit={submit}>
            {kind === "system" ? (
              <SettingItem
                label={t("settings.home.quickBarSystemAction")}
                htmlFor={`${id}-action`}
              >
                <Select
                  value={action}
                  onValueChange={(next) => {
                    if (
                      isActiveSystemAction(next) &&
                      isSystemActionOnSurface(next, "quick-bar")
                    )
                      setAction(next)
                  }}
                >
                  <SelectTrigger id={`${id}-action`} className="w-full">
                    <SelectValue>
                      {t(systemActionRegistry[action].labelKey)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {actions.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(systemActionRegistry[value].labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingItem>
            ) : (
              <>
                <SettingItem
                  label={t("grid.editor.name")}
                  htmlFor={`${id}-name`}
                >
                  <Input
                    id={`${id}-name`}
                    required
                    maxLength={80}
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value)
                      setError(null)
                    }}
                  />
                </SettingItem>
                <SettingItem label={t("grid.editor.url")} htmlFor={`${id}-url`}>
                  <Input
                    id={`${id}-url`}
                    required
                    placeholder="https://example.com"
                    value={url}
                    onChange={(event) => {
                      setUrl(event.target.value)
                      setError(null)
                    }}
                  />
                </SettingItem>
              </>
            )}
            {(error || full) && (
              <p role="alert" className="text-xs text-destructive">
                {t(
                  error === "site"
                    ? "grid.editor.invalidTab"
                    : "grid.buttonSlot.full"
                )}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setKind(null)
                  setError(null)
                }}
              >
                {t("grid.buttonSlot.backToTypes")}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                {t("grid.editor.cancel")}
              </Button>
              <Button type="submit" disabled={full}>
                {t("grid.dialog.add")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
