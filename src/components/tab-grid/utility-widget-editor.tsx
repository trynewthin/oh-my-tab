import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  componentLabel,
  getComponentDefinition,
  getComponentSize,
  getComponentSizeOptions,
  isComponentSize,
  sizeLabel,
} from "@/lib/grid/registry"
import {
  isUtilityWidget,
  type UtilityWidgetItem,
} from "@/lib/grid/utility-types"
import { validGridItem } from "@/lib/grid/validation"
import {
  applyUtilityConfiguration,
  localDateKey,
  MAX_COUNTDOWN_EVENTS,
  MAX_WORLD_CLOCKS,
} from "@/lib/widgets/model"
import { prepareWidgetPhoto } from "@/lib/widgets/photo"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { updateUtilityWidget } from "@/stores/widget-actions"

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      {label}
      {children}
    </label>
  )
}

export default function UtilityWidgetEditor({
  item,
  onClose,
  onSaved,
}: {
  item: UtilityWidgetItem
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(item)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const uploadSequence = useRef(0)
  const items = useTabGridStore((state) => state.items)
  const folders = items.filter((entry) => entry.kind === "folder")
  const sizes = getComponentSizeOptions(item.kind, "editor", draft.size)
  const currentSize = getComponentSize(item.kind, draft.size)

  useEffect(
    () => () => {
      uploadSequence.current += 1
    },
    []
  )

  const patch = (changes: object) =>
    setDraft((current) => ({ ...current, ...changes }) as UtilityWidgetItem)

  async function selectPhoto(file?: File) {
    if (!file) return
    const sequence = ++uploadSequence.current
    setUploading(true)
    setError(null)
    try {
      const image = await prepareWidgetPhoto(file)
      if (uploadSequence.current === sequence)
        setDraft((current) =>
          current.kind === "photo" ? { ...current, image } : current
        )
    } catch {
      if (uploadSequence.current === sequence) setError("photoInvalid")
    } finally {
      if (uploadSequence.current === sequence) setUploading(false)
    }
  }

  function save(event: FormEvent) {
    event.preventDefault()
    if (uploading) return
    const current = useTabGridStore
      .getState()
      .items.find((entry) => entry.id === item.id)
    if (!current || !isUtilityWidget(current)) {
      setError("removed")
      return
    }

    let clean = { ...draft, name: draft.name.trim() }
    if (!clean.name || clean.name.length > 40) {
      setError("invalidConfiguration")
      return
    }
    if (clean.kind === "clock")
      clean = { ...clean, timeZone: clean.timeZone.trim() }
    if (clean.kind === "rss")
      clean = { ...clean, feedUrl: clean.feedUrl.trim() }
    if (clean.kind === "github-repo")
      clean = { ...clean, repository: clean.repository.trim() }
    if (clean.kind === "countdown")
      clean = {
        ...clean,
        events: clean.events.map((entry) => ({
          ...entry,
          title: entry.title.trim(),
        })),
      }
    if (clean.kind === "world-clock")
      clean = {
        ...clean,
        zones: clean.zones.map((zone) => ({
          ...zone,
          label: zone.label.trim(),
          timeZone: zone.timeZone.trim(),
        })),
      }

    const next = applyUtilityConfiguration(current, clean)
    if (!validGridItem(next)) {
      setError("invalidConfiguration")
      return
    }
    try {
      updateUtilityWidget(item.id, (live) =>
        applyUtilityConfiguration(live, clean)
      )
      onSaved()
    } catch {
      setError("invalidConfiguration")
    }
  }

  function fields() {
    switch (draft.kind) {
      case "clock":
        return (
          <>
            <Field label={t("widgets.timeZone")}>
              <Input
                value={draft.timeZone}
                maxLength={100}
                placeholder={t("widgets.deviceTimeZone")}
                onChange={(event) => patch({ timeZone: event.target.value })}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.hour12}
                onChange={(event) => patch({ hour12: event.target.checked })}
              />
              {t("widgets.hour12")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.showSeconds}
                onChange={(event) =>
                  patch({ showSeconds: event.target.checked })
                }
              />
              {t("widgets.showSeconds")}
            </label>
            <p className="text-xs text-muted-foreground">
              {t("widgets.timeZoneHelp")}
            </p>
          </>
        )
      case "countdown":
        return (
          <>
            <p className="text-xs text-muted-foreground">
              {t("widgets.countdownHelp")}
            </p>
            {draft.events.map((entry, index) => (
              <fieldset
                key={entry.id}
                className="space-y-3 rounded-xl border p-3"
              >
                <legend className="px-1 text-xs">
                  {t("widgets.eventIndex", { index: index + 1 })}
                </legend>
                <Field label={t("widgets.eventTitle")}>
                  <Input
                    required
                    maxLength={40}
                    value={entry.title}
                    onChange={(event) =>
                      patch({
                        events: draft.events.map((value) =>
                          value.id === entry.id
                            ? { ...value, title: event.target.value }
                            : value
                        ),
                      })
                    }
                  />
                </Field>
                <Field label={t("widgets.date")}>
                  <Input
                    type="date"
                    required
                    min="1000-01-01"
                    max="9999-12-31"
                    value={entry.date}
                    onChange={(event) =>
                      patch({
                        events: draft.events.map((value) =>
                          value.id === entry.id
                            ? { ...value, date: event.target.value }
                            : value
                        ),
                      })
                    }
                  />
                </Field>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    patch({
                      events: draft.events.filter(
                        (value) => value.id !== entry.id
                      ),
                    })
                  }
                >
                  {t("widgets.remove")}
                </Button>
              </fieldset>
            ))}
            <Button
              type="button"
              variant="outline"
              disabled={draft.events.length >= MAX_COUNTDOWN_EVENTS}
              onClick={() =>
                patch({
                  events: [
                    ...draft.events,
                    {
                      id: crypto.randomUUID(),
                      title: t("widgets.event"),
                      date: localDateKey(),
                    },
                  ],
                })
              }
            >
              {t("widgets.addEvent")}
            </Button>
          </>
        )
      case "note":
        return (
          <p className="text-sm text-muted-foreground">
            {t("widgets.noteHelp")}
          </p>
        )
      case "pomodoro":
        return (
          <>
            <Field label={t("widgets.durationMinutes")}>
              <Input
                type="number"
                required
                min={1}
                max={180}
                step={1}
                value={draft.minutes}
                onChange={(event) =>
                  patch({ minutes: event.target.valueAsNumber })
                }
              />
            </Field>
            <p className="text-xs text-muted-foreground">
              {t("widgets.pomodoroHelp")}
            </p>
          </>
        )
      case "weather":
        return (
          <>
            <Field label={t("widgets.locationName")}>
              <Input
                maxLength={40}
                value={draft.locationName}
                onChange={(event) =>
                  patch({ locationName: event.target.value })
                }
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("widgets.latitude")}>
                <Input
                  type="number"
                  step="any"
                  min={-90}
                  max={90}
                  value={draft.latitude ?? ""}
                  onChange={(event) =>
                    patch({
                      latitude:
                        event.target.value === ""
                          ? null
                          : event.target.valueAsNumber,
                    })
                  }
                />
              </Field>
              <Field label={t("widgets.longitude")}>
                <Input
                  type="number"
                  step="any"
                  min={-180}
                  max={180}
                  value={draft.longitude ?? ""}
                  onChange={(event) =>
                    patch({
                      longitude:
                        event.target.value === ""
                          ? null
                          : event.target.valueAsNumber,
                    })
                  }
                />
              </Field>
            </div>
            <Field label={t("widgets.temperatureUnit")}>
              <select
                className="h-9 rounded-md border bg-background px-3"
                value={draft.unit}
                onChange={(event) =>
                  patch({
                    unit:
                      event.target.value === "fahrenheit"
                        ? "fahrenheit"
                        : "celsius",
                  })
                }
              >
                <option value="celsius">°C</option>
                <option value="fahrenheit">°F</option>
              </select>
            </Field>
            <p className="text-xs text-muted-foreground">
              {t("widgets.weatherPrivacy")}
            </p>
          </>
        )
      case "photo":
        return (
          <>
            <Field label={t("widgets.photoFile")}>
              <Input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={uploading}
                onChange={(event) => {
                  void selectPhoto(event.target.files?.[0])
                  event.target.value = ""
                }}
              />
            </Field>
            <p className="text-xs text-muted-foreground">
              {t(uploading ? "widgets.processingPhoto" : "widgets.photoHelp")}
            </p>
            {draft.image && (
              <>
                <img
                  src={draft.image}
                  alt={draft.caption || draft.name}
                  className="h-32 w-full rounded-lg object-contain"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => patch({ image: "" })}
                >
                  {t("widgets.removePhoto")}
                </Button>
              </>
            )}
            <Field label={t("widgets.caption")}>
              <Input
                value={draft.caption}
                maxLength={120}
                onChange={(event) => patch({ caption: event.target.value })}
              />
            </Field>
            <Field label={t("widgets.photoFit")}>
              <select
                className="h-9 rounded-md border bg-background px-3"
                value={draft.fit}
                onChange={(event) =>
                  patch({
                    fit: event.target.value === "contain" ? "contain" : "cover",
                  })
                }
              >
                <option value="cover">{t("widgets.cover")}</option>
                <option value="contain">{t("widgets.contain")}</option>
              </select>
            </Field>
          </>
        )
      case "bookmark-list":
        return (
          <>
            <Field label={t("widgets.sourceFolder")}>
              <select
                className="h-9 rounded-md border bg-background px-3"
                value={draft.folderId}
                onChange={(event) => patch({ folderId: event.target.value })}
              >
                <option value="">{t("widgets.chooseFolder")}</option>
                {draft.folderId &&
                  !folders.some((folder) => folder.id === draft.folderId) && (
                    <option value={draft.folderId}>
                      {t("widgets.missingFolder")}
                    </option>
                  )}
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </Field>
            <p className="text-xs text-muted-foreground">
              {t("widgets.folderHelp")}
            </p>
          </>
        )
      case "rss":
        return (
          <>
            <Field label={t("widgets.feedUrl")}>
              <Input
                type="url"
                maxLength={2048}
                value={draft.feedUrl}
                placeholder="https://example.com/feed.xml"
                onChange={(event) => patch({ feedUrl: event.target.value })}
              />
            </Field>
            <p className="text-xs text-muted-foreground">
              {t("widgets.rssPrivacy")}
            </p>
          </>
        )
      case "github-repo":
        return (
          <>
            <Field label={t("widgets.repository")}>
              <Input
                maxLength={140}
                value={draft.repository}
                placeholder="owner/repository"
                onChange={(event) => patch({ repository: event.target.value })}
              />
            </Field>
            <p className="text-xs text-muted-foreground">
              {t("widgets.githubPrivacy")}
            </p>
          </>
        )
      case "world-clock":
        return (
          <>
            {draft.zones.map((zone, index) => (
              <fieldset
                key={zone.id}
                className="space-y-3 rounded-xl border p-3"
              >
                <legend className="px-1 text-xs">
                  {t("widgets.zoneIndex", { index: index + 1 })}
                </legend>
                <Field label={t("widgets.cityLabel")}>
                  <Input
                    required
                    maxLength={40}
                    value={zone.label}
                    onChange={(event) =>
                      patch({
                        zones: draft.zones.map((value) =>
                          value.id === zone.id
                            ? { ...value, label: event.target.value }
                            : value
                        ),
                      })
                    }
                  />
                </Field>
                <Field label={t("widgets.timeZone")}>
                  <Input
                    required
                    maxLength={100}
                    placeholder="Asia/Tokyo"
                    value={zone.timeZone}
                    onChange={(event) =>
                      patch({
                        zones: draft.zones.map((value) =>
                          value.id === zone.id
                            ? { ...value, timeZone: event.target.value }
                            : value
                        ),
                      })
                    }
                  />
                </Field>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={draft.zones.length === 1}
                  onClick={() =>
                    patch({
                      zones: draft.zones.filter(
                        (value) => value.id !== zone.id
                      ),
                    })
                  }
                >
                  {t("widgets.remove")}
                </Button>
              </fieldset>
            ))}
            <Button
              type="button"
              variant="outline"
              disabled={draft.zones.length >= MAX_WORLD_CLOCKS}
              onClick={() =>
                patch({
                  zones: [
                    ...draft.zones,
                    {
                      id: crypto.randomUUID(),
                      label: "UTC",
                      timeZone: "UTC",
                    },
                  ],
                })
              }
            >
              {t("widgets.addZone")}
            </Button>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.hour12}
                onChange={(event) => patch({ hour12: event.target.checked })}
              />
              {t("widgets.hour12")}
            </label>
            <p className="text-xs text-muted-foreground">
              {t("widgets.timeZoneHelp")}
            </p>
          </>
        )
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[85svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("grid.editor.editTitle", {
              label: componentLabel(item.kind, t),
            })}
          </DialogTitle>
          <DialogDescription>
            {t("widgets.editorDescription")}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={save}>
          <Field label={t("grid.editor.name")}>
            <Input
              required
              maxLength={40}
              value={draft.name}
              onChange={(event) => patch({ name: event.target.value })}
            />
          </Field>
          <div className="space-y-2">
            <label htmlFor={`widget-size-${item.id}`} className="text-sm">
              {t("grid.editor.displaySize")}
            </label>
            <Select
              value={draft.size}
              onValueChange={(value) => {
                if (isComponentSize(item.kind, value))
                  patch({ size: value as UtilityWidgetItem["size"] })
              }}
            >
              <SelectTrigger id={`widget-size-${item.id}`} className="w-full">
                <SelectValue>
                  {currentSize ? sizeLabel(currentSize, t) : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {sizes.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {sizeLabel(size, t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {getComponentDefinition(item.kind).actions.randomColor && (
            <Field label={t("grid.editor.backgroundColor")}>
              <input
                type="color"
                value={draft.color}
                className="h-8 w-full cursor-pointer rounded border"
                onChange={(event) => patch({ color: event.target.value })}
              />
            </Field>
          )}
          {fields()}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {t(`widgets.errors.${error}`)}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("grid.editor.cancel")}
            </Button>
            <Button type="submit" disabled={uploading}>
              {t("grid.editor.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
