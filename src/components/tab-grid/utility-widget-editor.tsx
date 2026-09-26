import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import ColorPicker from "@/components/ui/color-picker"
import WidgetEditorPreview from "./utility/editor-preview"
import "./utility/editor.css"
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
    <label className="utility-editor-field">
      {label}
      {children}
    </label>
  )
}

function SwitchField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  const id = useId()
  return (
    <div className="utility-editor-switch-row">
      <label htmlFor={id}>{label}</label>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className="data-checked:bg-foreground [&_[data-slot=switch-thumb]]:bg-background"
      />
    </div>
  )
}

function ChoiceField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  const id = useId()
  return (
    <div className="utility-editor-field">
      <label htmlFor={id}>{label}</label>
      <Select
        value={value}
        onValueChange={(next) => {
          if (next !== null) onChange(String(next))
        }}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue>
            {options.find((option) => option.value === value)?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
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
            <SwitchField
              label={t("widgets.hour12")}
              checked={draft.hour12}
              onChange={(hour12) => patch({ hour12 })}
            />
            <SwitchField
              label={t("widgets.showSeconds")}
              checked={draft.showSeconds}
              onChange={(showSeconds) => patch({ showSeconds })}
            />
            <p className="utility-editor-help">{t("widgets.timeZoneHelp")}</p>
          </>
        )
      case "countdown":
        return (
          <>
            <p className="utility-editor-help">{t("widgets.countdownHelp")}</p>
            {draft.events.map((entry, index) => (
              <fieldset key={entry.id} className="utility-editor-group">
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
        return <p className="utility-editor-help">{t("widgets.noteHelp")}</p>
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
            <p className="utility-editor-help">{t("widgets.pomodoroHelp")}</p>
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
            <ChoiceField
              label={t("widgets.temperatureUnit")}
              value={draft.unit}
              options={[
                { value: "celsius", label: "°C" },
                { value: "fahrenheit", label: "°F" },
              ]}
              onChange={(value) =>
                patch({
                  unit: value === "fahrenheit" ? "fahrenheit" : "celsius",
                })
              }
            />
            <p className="utility-editor-help">{t("widgets.weatherPrivacy")}</p>
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
            <p className="utility-editor-help">
              {t(uploading ? "widgets.processingPhoto" : "widgets.photoHelp")}
            </p>
            {draft.image && (
              <>
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
            <ChoiceField
              label={t("widgets.photoFit")}
              value={draft.fit}
              options={[
                { value: "cover", label: t("widgets.cover") },
                { value: "contain", label: t("widgets.contain") },
              ]}
              onChange={(value) =>
                patch({ fit: value === "contain" ? "contain" : "cover" })
              }
            />
          </>
        )
      case "bookmark-list":
        return (
          <>
            <ChoiceField
              label={t("widgets.sourceFolder")}
              value={draft.folderId}
              options={[
                { value: "", label: t("widgets.chooseFolder") },
                ...(draft.folderId &&
                !folders.some((folder) => folder.id === draft.folderId)
                  ? [
                      {
                        value: draft.folderId,
                        label: t("widgets.missingFolder"),
                      },
                    ]
                  : []),
                ...folders.map((folder) => ({
                  value: folder.id,
                  label: folder.name,
                })),
              ]}
              onChange={(folderId) => patch({ folderId })}
            />
            <p className="utility-editor-help">{t("widgets.folderHelp")}</p>
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
            <p className="utility-editor-help">{t("widgets.rssPrivacy")}</p>
          </>
        )
      case "world-clock":
        return (
          <>
            {draft.zones.map((zone, index) => (
              <fieldset key={zone.id} className="utility-editor-group">
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
            <SwitchField
              label={t("widgets.hour12")}
              checked={draft.hour12}
              onChange={(hour12) => patch({ hour12 })}
            />
            <p className="utility-editor-help">{t("widgets.timeZoneHelp")}</p>
          </>
        )
    }
  }

  const previewItem = validGridItem(draft)
    ? applyUtilityConfiguration(item, draft)
    : item
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="utility-editor">
        <DialogHeader className="utility-editor-heading">
          <DialogTitle>
            {t("grid.editor.editTitle", {
              label: componentLabel(item.kind, t),
            })}
          </DialogTitle>
          <DialogDescription>
            {t("widgets.design.editorHint")}
          </DialogDescription>
        </DialogHeader>
        <form className="utility-editor-form" onSubmit={save}>
          <div className="utility-editor-layout">
            <WidgetEditorPreview item={previewItem} />
            <div className="utility-editor-fields">
              <Field label={t("grid.editor.name")}>
                <Input
                  required
                  maxLength={40}
                  value={draft.name}
                  onChange={(event) => patch({ name: event.target.value })}
                />
              </Field>
              <div className="utility-editor-field">
                <span id={`widget-size-${item.id}`}>
                  {t("grid.editor.displaySize")}
                </span>
                <ToggleGroup
                  value={[draft.size]}
                  aria-labelledby={`widget-size-${item.id}`}
                  className="utility-editor-size-options"
                  onValueChange={(values) => {
                    const value = values[0]
                    if (isComponentSize(item.kind, value))
                      patch({ size: value })
                  }}
                >
                  {sizes.map((size) => (
                    <ToggleGroupItem
                      key={size.value}
                      value={size.value}
                      aria-label={sizeLabel(size, t)}
                      title={sizeLabel(size, t)}
                    >
                      <span
                        className="utility-size-mark"
                        aria-hidden="true"
                        style={{
                          aspectRatio: `${size.width}/${size.height}`,
                          width: `${Math.min(18, (18 * size.width) / size.height)}px`,
                        }}
                      />
                      <span>
                        {size.width}×{size.height}
                      </span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
              {getComponentDefinition(item.kind).actions.randomColor && (
                <div className="utility-editor-field">
                  <span>{t("grid.editor.backgroundColor")}</span>
                  <ColorPicker
                    label={t("grid.editor.backgroundColor")}
                    value={draft.color}
                    onChange={(color) => patch({ color })}
                  />
                </div>
              )}
              {fields()}
            </div>
          </div>
          {error && (
            <p role="alert" className="utility-editor-error">
              {t(`widgets.errors.${error}`)}
            </p>
          )}
          <DialogFooter className="utility-editor-footer">
            <Button type="button" variant="ghost" onClick={onClose}>
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
