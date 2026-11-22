import { useId, useState, type ReactNode } from "react"
import {
  ArrowClockwise,
  DownloadSimple,
  Minus,
  Plus,
  Shuffle,
} from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import ColorPicker from "@/components/ui/color-picker"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  defaultFairIsleSettings,
  fairIsleModes,
  fairIsleMotifs,
  fairIslePaletteIds,
  fairIslePalettes,
  fairIslePatternIds,
  fairIslePatterns,
  MAX_FAIR_ISLE_STITCH_SIZE,
  MAX_FAIR_ISLE_YARNS,
  MIN_FAIR_ISLE_STITCH_SIZE,
  MIN_FAIR_ISLE_YARNS,
  type FairIsleSettings,
} from "@/lib/fair-isle-settings"
import {
  createFairIsleSeed,
  randomFairIslePalette,
  type FairIsleTexture,
} from "@/lib/fair-isle"
import AppearanceTabs from "./appearance-tabs"
import SettingItem from "../shared/setting-item"
import SettingRange from "../shared/setting-range"
import { settingsControlClassName } from "../shared/control-styles"
import { exportFairIsle, type FairIsleExportFormat } from "./fair-isle-export"

type PreviewOptions = {
  guides: boolean
  fit: boolean
}

function FairIsleSelect<T extends string>({
  id,
  value,
  options,
  label,
  onChange,
}: {
  id: string
  value: T
  options: readonly T[]
  label: (option: T) => string
  onChange: (option: T) => void
}) {
  return (
    <Select
      value={value}
      onValueChange={(value) => {
        const selected = options.find((option) => option === value)
        if (selected !== undefined) onChange(selected)
      }}
    >
      <SelectTrigger
        id={id}
        className={`w-full min-w-0 ${settingsControlClassName}`}
      >
        <SelectValue>{label(value)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {label(option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default function FairIsleSettingsFields({
  value,
  onChange,
  texture,
  color,
  preview,
  setPreview,
  getPreviewFrame,
  renderSection,
}: {
  value: FairIsleSettings
  onChange: (patch: Partial<FairIsleSettings>) => void
  texture: FairIsleTexture
  color: string
  preview: PreviewOptions
  setPreview: (next: PreviewOptions) => void
  getPreviewFrame: () => Parameters<typeof exportFairIsle>[4]
  renderSection: (actions: ReactNode, fields: ReactNode) => ReactNode
}) {
  const { t } = useTranslation()
  const id = useId()
  const [seedDraft, setSeedDraft] = useState<string | null>(null)
  const [format, setFormat] = useState<FairIsleExportFormat>("tile")
  const [exportSize, setExportSize] = useState("2048")
  const [exportStatus, setExportStatus] = useState<"idle" | "busy" | "error">(
    "idle"
  )
  const translate = (key: string) => t(`settings.material.fairIsle.${key}`)

  const setSeed = (seed: string) => {
    const next = seed.trim() || value.seed
    setSeedDraft(null)
    if (next !== value.seed) onChange({ seed: next })
  }

  const randomize = () => {
    const seed = createFairIsleSeed()
    const pattern =
      fairIslePatternIds[Math.floor(Math.random() * fairIslePatternIds.length)]
    const preset =
      Math.random() < 0.35
        ? fairIslePaletteIds[
            Math.floor(Math.random() * fairIslePaletteIds.length)
          ]
        : null
    setSeedDraft(null)
    onChange({
      seed,
      pattern,
      motifs: [...fairIslePatterns[pattern]],
      palette: preset ?? "random",
      colors: preset
        ? [...fairIslePalettes[preset]]
        : randomFairIslePalette(5 + Math.floor(Math.random() * 3)),
      bands: 4 + Math.floor(Math.random() * 3),
      symmetry: Math.random() < 0.28,
    })
  }

  const save = async () => {
    setExportStatus("busy")
    try {
      await exportFairIsle(
        value,
        texture,
        format,
        Number(exportSize),
        getPreviewFrame()
      )
      setExportStatus("idle")
    } catch {
      setExportStatus("error")
    }
  }

  const actions = (
    <div className="flex shrink-0 gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="max-md:w-8 max-md:px-0"
        title={translate("randomize")}
        onClick={randomize}
      >
        <Shuffle aria-hidden="true" />
        <span className="max-md:sr-only">{translate("randomize")}</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="max-md:w-8 max-md:px-0"
        title={translate("reset")}
        onClick={() => {
          setSeedDraft(null)
          setPreview({ guides: false, fit: false })
          onChange(defaultFairIsleSettings)
        }}
      >
        <ArrowClockwise aria-hidden="true" />
        <span className="max-md:sr-only">{translate("reset")}</span>
      </Button>
    </div>
  )

  return renderSection(
    actions,
    <div className="space-y-4">
      <SettingItem label={translate("pattern")} htmlFor={`${id}-pattern`}>
        <FairIsleSelect
          id={`${id}-pattern`}
          value={value.pattern}
          options={[...fairIslePatternIds, "custom"]}
          label={(option) => translate(`patterns.${option}`)}
          onChange={(pattern) =>
            onChange(
              pattern === "custom"
                ? { pattern }
                : { pattern, motifs: [...fairIslePatterns[pattern]] }
            )
          }
        />
      </SettingItem>
      <SettingItem label={translate("motifList")} labelId={`${id}-motifs`} wide>
        <ToggleGroup
          multiple
          value={value.motifs}
          aria-labelledby={`${id}-motifs`}
          className="flex flex-wrap gap-1.5"
          onValueChange={(next) => {
            const motifs = fairIsleMotifs.filter((motif) =>
              next.includes(motif)
            )
            if (motifs.length) onChange({ motifs, pattern: "custom" })
          }}
        >
          {fairIsleMotifs.map((motif) => (
            <ToggleGroupItem
              key={motif}
              value={motif}
              disabled={value.motifs.length === 1 && value.motifs[0] === motif}
            >
              {translate(`motifs.${motif}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </SettingItem>
      <SettingItem label={translate("palette")} htmlFor={`${id}-palette`}>
        <FairIsleSelect
          id={`${id}-palette`}
          value={value.palette}
          options={[...fairIslePaletteIds, "random", "custom"]}
          label={(option) => translate(`palettes.${option}`)}
          onChange={(palette) => {
            if (palette === "custom") onChange({ palette })
            else if (palette === "random")
              onChange({
                palette,
                colors: randomFairIslePalette(value.colors.length),
              })
            else onChange({ palette, colors: [...fairIslePalettes[palette]] })
          }}
        />
      </SettingItem>
      <SettingItem label={translate("yarns")} labelId={`${id}-yarns`} wide>
        <div role="group" aria-labelledby={`${id}-yarns`} className="space-y-2">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {value.colors.map((yarn, index) => (
              <ColorPicker
                key={index}
                label={t("settings.material.fairIsle.yarn", {
                  index: index + 1,
                })}
                value={yarn}
                onChange={(next) =>
                  onChange({
                    palette: "custom",
                    colors: value.colors.map((old, i) =>
                      i === index ? next : old
                    ),
                  })
                }
              />
            ))}
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={translate("removeYarn")}
              disabled={value.colors.length <= MIN_FAIR_ISLE_YARNS}
              onClick={() =>
                onChange({
                  palette: "custom",
                  colors: value.colors.slice(0, -1),
                })
              }
            >
              <Minus />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={translate("addYarn")}
              disabled={value.colors.length >= MAX_FAIR_ISLE_YARNS}
              onClick={() =>
                onChange({
                  palette: "custom",
                  colors: [
                    ...value.colors,
                    randomFairIslePalette(MAX_FAIR_ISLE_YARNS)[
                      value.colors.length
                    ],
                  ],
                })
              }
            >
              <Plus />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onChange({
                  palette: "random",
                  colors: randomFairIslePalette(value.colors.length),
                })
              }
            >
              <Shuffle aria-hidden="true" />
              {translate("randomPalette")}
            </Button>
          </div>
        </div>
      </SettingItem>
      <SettingItem label={translate("stitchSize")} htmlFor={`${id}-size`}>
        <SettingRange
          id={`${id}-size`}
          label={translate("stitchSize")}
          min={MIN_FAIR_ISLE_STITCH_SIZE}
          max={MAX_FAIR_ISLE_STITCH_SIZE}
          step={1}
          value={value.stitchSize}
          onChange={(stitchSize) => {
            if (preview.fit) setPreview({ ...preview, fit: false })
            onChange({ stitchSize })
          }}
          accentColor={color}
          editable={false}
          formatValue={(size) => `${size} px`}
        />
      </SettingItem>
      <SettingItem label={translate("bands")} htmlFor={`${id}-bands`}>
        <SettingRange
          id={`${id}-bands`}
          label={translate("bands")}
          min={3}
          max={8}
          step={1}
          value={value.bands}
          onChange={(bands) => onChange({ bands })}
          accentColor={color}
          editable={false}
        />
      </SettingItem>
      <SettingItem label={translate("symmetry")} htmlFor={`${id}-symmetry`}>
        <Switch
          id={`${id}-symmetry`}
          checked={value.symmetry}
          className="justify-self-end"
          onCheckedChange={(symmetry) => onChange({ symmetry })}
        />
      </SettingItem>
      <SettingItem label={translate("seed")} htmlFor={`${id}-seed`}>
        <div className="flex min-w-0 items-center gap-1.5">
          <Input
            id={`${id}-seed`}
            value={seedDraft ?? value.seed}
            maxLength={32}
            spellCheck={false}
            autoComplete="off"
            className="font-mono"
            onChange={(event) => setSeedDraft(event.currentTarget.value)}
            onBlur={() => {
              if (seedDraft !== null) setSeed(seedDraft)
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                event.currentTarget.blur()
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={translate("randomSeed")}
            onClick={() => setSeed(createFairIsleSeed())}
          >
            <Shuffle aria-hidden="true" />
          </Button>
        </div>
      </SettingItem>
      <AppearanceTabs
        label={translate("mode")}
        options={fairIsleModes}
        value={value.mode}
        getOptionLabel={(mode) => translate(`modes.${mode}`)}
        onChange={(mode) => onChange({ mode })}
      />
      <SettingItem label={translate("fit")} htmlFor={`${id}-fit`}>
        <Switch
          id={`${id}-fit`}
          checked={preview.fit}
          className="justify-self-end"
          onCheckedChange={(fit) => setPreview({ ...preview, fit })}
        />
      </SettingItem>
      <SettingItem label={translate("guides")} htmlFor={`${id}-guides`}>
        <Switch
          id={`${id}-guides`}
          checked={preview.guides && !preview.fit}
          disabled={preview.fit}
          className="justify-self-end"
          onCheckedChange={(guides) => setPreview({ ...preview, guides })}
        />
      </SettingItem>
      <div className="space-y-2 border-t border-border pt-3">
        <SettingItem label={translate("exportFormat")} htmlFor={`${id}-format`}>
          <FairIsleSelect
            id={`${id}-format`}
            value={format}
            options={["preview", "tile", "svg"]}
            label={(option) => translate(`formats.${option}`)}
            onChange={setFormat}
          />
        </SettingItem>
        {format !== "svg" && (
          <SettingItem
            label={translate("exportSize")}
            htmlFor={`${id}-export-size`}
          >
            <FairIsleSelect
              id={`${id}-export-size`}
              value={exportSize}
              options={["1024", "2048", "4096"]}
              label={(option) => `${option} px`}
              onChange={setExportSize}
            />
          </SettingItem>
        )}
        <div className="flex items-center justify-end gap-2">
          {exportStatus === "error" && (
            <p role="alert" className="text-xs text-destructive">
              {translate("exportError")}
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={exportStatus === "busy"}
            onClick={() => void save()}
          >
            <DownloadSimple aria-hidden="true" />
            {translate(exportStatus === "busy" ? "exporting" : "export")}
          </Button>
        </div>
      </div>
    </div>
  )
}
