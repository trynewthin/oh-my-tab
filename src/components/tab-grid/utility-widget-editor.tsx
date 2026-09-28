import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import SettingItem from "@/components/settings/shared/setting-item"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import DatePicker from "@/components/ui/date-picker"
import TimePicker from "@/components/ui/time-picker"
import { Switch } from "@/components/ui/switch"
import ColorPicker from "@/components/ui/color-picker"
import ComponentEditorFrame from "./component-editor-frame"
import UtilityWidgetTile from "./utility-widget-tile"
import "./utility/editor.css"
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
} from "@/lib/grid/registry"
import {
  isUtilityWidget,
  type UtilityWidgetItem,
} from "@/lib/grid/utility-types"
import { validGridItem } from "@/lib/grid/validation"
import {
  applyUtilityConfiguration,
  localDateKey,
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
  const eventFieldId = useId()
  const durationId = useId()
  const breakDurationId = useId()
  const loopId = useId()
  const workdayId = useId()
  const clockId = useId()
  const [draft, setDraft] = useState<UtilityWidgetItem>(() =>
    item.kind === "countdown" && item.event === null
      ? { ...item, event: { title: "", date: localDateKey() } }
      : item
  )
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const uploadSequence = useRef(0)
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

  function save() {
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
        event: clean.event
          ? { ...clean.event, title: clean.event.title.trim() }
          : null,
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

    if (clean.kind === "workday" && clean.startTime === clean.endTime) {
      setError("sameWorkTimes")
      return
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
            <SettingItem
              label={t("widgets.clockEffect")}
              htmlFor={`${clockId}-effect`}
            >
              <Select
                value={draft.effect}
                onValueChange={(effect) => {
                  if (effect === "plain" || effect === "dots") patch({ effect })
                }}
              >
                <SelectTrigger id={`${clockId}-effect`} className="w-full">
                  <SelectValue>
                    {t(
                      draft.effect === "dots"
                        ? "widgets.clockDots"
                        : "widgets.clockPlain"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plain">
                    {t("widgets.clockPlain")}
                  </SelectItem>
                  <SelectItem value="dots">{t("widgets.clockDots")}</SelectItem>
                </SelectContent>
              </Select>
            </SettingItem>
            <SettingItem
              label={t("widgets.timeZone")}
              htmlFor={`${clockId}-zone`}
              description={t("widgets.timeZoneHelp")}
            >
              <Input
                id={`${clockId}-zone`}
                value={draft.timeZone}
                maxLength={100}
                placeholder={t("widgets.deviceTimeZone")}
                onChange={(event) => patch({ timeZone: event.target.value })}
              />
            </SettingItem>
          </>
        )
      case "countdown":
        return (
          <>
            <SettingItem
              label={t("widgets.eventTitle")}
              htmlFor={`${eventFieldId}-title`}
            >
              <Input
                id={`${eventFieldId}-title`}
                required
                maxLength={40}
                value={draft.event?.title ?? ""}
                onChange={(event) =>
                  patch({
                    event: {
                      title: event.target.value,
                      date: draft.event?.date ?? localDateKey(),
                    },
                  })
                }
              />
            </SettingItem>
            <SettingItem
              label={t("widgets.date")}
              htmlFor={`${eventFieldId}-date`}
              description={t("widgets.countdownHelp")}
            >
              <DatePicker
                id={`${eventFieldId}-date`}
                value={
                  new Date(`${draft.event?.date ?? localDateKey()}T00:00:00`)
                }
                onChange={(date) =>
                  patch({
                    event: {
                      title: draft.event?.title ?? "",
                      date: localDateKey(date),
                    },
                  })
                }
              />
            </SettingItem>
          </>
        )
      case "note":
        return <p className="utility-editor-help">{t("widgets.noteHelp")}</p>
      case "workday":
        return (
          <>
            <SettingItem
              label={t("widgets.workday.startTime")}
              htmlFor={`${workdayId}-start`}
            >
              <TimePicker
                id={`${workdayId}-start`}
                hourLabel={t("widgets.workday.startHour")}
                minuteLabel={t("widgets.workday.startMinute")}
                value={draft.startTime}
                onChange={(startTime) => patch({ startTime })}
              />
            </SettingItem>
            <SettingItem
              label={t("widgets.workday.endTime")}
              htmlFor={`${workdayId}-end`}
              description={t("widgets.workday.help")}
            >
              <TimePicker
                id={`${workdayId}-end`}
                hourLabel={t("widgets.workday.endHour")}
                minuteLabel={t("widgets.workday.endMinute")}
                value={draft.endTime}
                onChange={(endTime) => patch({ endTime })}
              />
            </SettingItem>
          </>
        )
      case "pomodoro":
        return (
          <>
            <SettingItem
              label={t("widgets.durationMinutes")}
              htmlFor={durationId}
              description={t("widgets.pomodoroHelp")}
            >
              <Input
                id={durationId}
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
            </SettingItem>
            <SettingItem
              label={t("widgets.breakMinutes")}
              htmlFor={breakDurationId}
              description={t("widgets.breakHelp")}
            >
              <Input
                id={breakDurationId}
                type="number"
                required
                min={0}
                max={180}
                step={1}
                value={draft.breakMinutes ?? 0}
                onChange={(event) =>
                  patch({ breakMinutes: event.target.valueAsNumber })
                }
              />
            </SettingItem>
            <SettingItem
              label={t("widgets.loop")}
              htmlFor={loopId}
              description={t("widgets.loopHelp")}
            >
              <Switch
                id={loopId}
                checked={draft.loop ?? false}
                onCheckedChange={(loop) => patch({ loop })}
                className="justify-self-end data-checked:bg-foreground [&_[data-slot=switch-thumb]]:bg-background"
              />
            </SettingItem>
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
  const dimensions =
    getComponentSize(item.kind, draft.size) ??
    getComponentSize(item.kind, item.size)!
  return (
    <ComponentEditorFrame
      title={t("grid.editor.editTitle", {
        label: componentLabel(item.kind, t),
      })}
      description={t("widgets.design.editorHint")}
      width={dimensions.width}
      height={dimensions.height}
      preview={
        <UtilityWidgetTile
          item={previewItem}
          preview
          sample={false}
          onOpen={() => {}}
        />
      }
      previewBorder={getComponentDefinition(item.kind).tileBorder}
      sizeOptions={sizes}
      size={draft.size}
      onSizeChange={(value) => {
        if (isComponentSize(item.kind, value)) patch({ size: value })
      }}
      submitLabel={t("grid.editor.save")}
      submitDisabled={uploading}
      onSubmit={save}
      onClose={onClose}
    >
      <div className="utility-editor-fields">
        {draft.kind !== "pomodoro" &&
          draft.kind !== "countdown" &&
          draft.kind !== "workday" &&
          draft.kind !== "clock" && (
            <Field label={t("grid.editor.name")}>
              <Input
                required
                maxLength={40}
                value={draft.name}
                onChange={(event) => patch({ name: event.target.value })}
              />
            </Field>
          )}
        {draft.kind === "pomodoro" ||
        draft.kind === "countdown" ||
        draft.kind === "workday" ||
        draft.kind === "clock" ? (
          <SettingItem
            label={t(
              draft.kind === "clock"
                ? "widgets.clockColor"
                : "grid.editor.backgroundColor"
            )}
          >
            <ColorPicker
              label={t(
                draft.kind === "clock"
                  ? "widgets.clockColor"
                  : "grid.editor.backgroundColor"
              )}
              value={draft.color}
              onChange={(color) => patch({ color })}
            />
          </SettingItem>
        ) : (
          getComponentDefinition(item.kind).actions.randomColor && (
            <div className="utility-editor-field">
              <span>{t("grid.editor.backgroundColor")}</span>
              <ColorPicker
                label={t("grid.editor.backgroundColor")}
                value={draft.color}
                onChange={(color) => patch({ color })}
              />
            </div>
          )
        )}
        {fields()}
        {(item.kind === "weather" || item.kind === "rss") && (
          <p className="utility-editor-help">{t("widgets.previewOnly")}</p>
        )}
      </div>
      {error && (
        <p role="alert" className="utility-editor-error">
          {t(`widgets.errors.${error}`)}
        </p>
      )}
    </ComponentEditorFrame>
  )
}
