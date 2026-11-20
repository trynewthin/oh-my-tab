import { Gear } from "@phosphor-icons/react"
import { useId, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { controlMaterialImage } from "@/components/effects/control-material-image"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createFairIsleTexture } from "@/lib/fair-isle"
import { materialOptions, type MaterialStyle } from "@/lib/material"
import {
  DEFAULT_STAR_TRAIL_SPEED,
  MAX_STAR_TRAIL_SPEED,
  MIN_STAR_TRAIL_SPEED,
} from "@/lib/star-trails"
import {
  materialAmplitudeMax,
  type SettingsAppearance,
  type SettingsMaterialParameters,
  type SettingsMaterialSlot,
} from "@/lib/ui-appearance"
import { cn } from "@/lib/utils"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import SettingsMaterialSurface from "../settings-material-surface"
import { settingsControlClassName } from "../shared/control-styles"
import SettingItem from "../shared/setting-item"
import SettingRange from "../shared/setting-range"
import { AppearancePreviewFrame } from "./appearance-preview-stage"
import AppearanceTabs from "./appearance-tabs"
import FairIsleSettingsFields from "./fair-isle-settings"
import LiquidGlassSettingsFields from "./liquid-glass-settings"

const defaultPreview = { fit: false, guides: false }
const starModes = ["dynamic", "static"] as const
const defaultStarTrails = {
  mode: "static",
  speed: DEFAULT_STAR_TRAIL_SPEED,
} as const

export default function SettingsMaterialEditor({
  slot,
  label,
  material,
  appearance,
  onSave,
}: {
  slot: SettingsMaterialSlot
  label: string
  material: MaterialStyle
  appearance?: SettingsAppearance
  onSave: (patch: SettingsMaterialParameters) => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const [open, setOpen] = useState(false)
  const triggerLabel = t("settings.material.configurePlacement", {
    placement: label,
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        aria-label={triggerLabel}
        title={triggerLabel}
        disabled={material === "none"}
        render={
          <Button
            variant="outline"
            size="icon"
            className={settingsControlClassName}
          />
        }
      >
        <Gear aria-hidden="true" />
      </DialogTrigger>
      {open && material !== "none" && (
        <MaterialEditorContent
          key={material}
          id={id}
          slot={slot}
          label={label}
          material={material}
          appearance={appearance}
          onSave={onSave}
        />
      )}
    </Dialog>
  )
}

function MaterialEditorContent({
  id,
  slot,
  label,
  material,
  appearance,
  onSave,
}: {
  id: string
  slot: SettingsMaterialSlot
  label: string
  material: Exclude<MaterialStyle, "none">
  appearance?: SettingsAppearance
  onSave: (patch: SettingsMaterialParameters) => void
}) {
  const { t } = useTranslation()
  const color = useHomeSettingsStore((state) => state.color)
  const defaultFairIsle = useHomeSettingsStore((state) => state.fairIsle)
  const defaultGlass = useHomeSettingsStore((state) => state.liquidGlass)
  const defaultAmplitude = useHomeSettingsStore(
    (state) => state.burningAmplitude
  )
  const [draft, setDraft] = useState<SettingsMaterialParameters>({})
  const [preview, setPreview] = useState(defaultPreview)
  const frame = useRef<HTMLDivElement>(null)
  const parameters = { ...appearance?.materialParameters?.[slot], ...draft }
  const fairIsle = parameters["fair-isle"] ?? defaultFairIsle
  const glass = parameters["liquid-glass"] ?? defaultGlass
  const stars = parameters["star-trails"] ?? defaultStarTrails
  const control = slot === "control"
  const texture =
    material === "fair-isle" ? createFairIsleTexture(fairIsle) : null
  const patch = (next: SettingsMaterialParameters) =>
    setDraft((current) => ({ ...current, ...next }))
  const intensityControl =
    material === "burning" ||
    material === "particles" ||
    material === "star-trails"
  const intensityLabel = t(
    material === "star-trails"
      ? "settings.material.runningSpeed"
      : control
        ? "settings.material.textureStrength"
        : material === "burning"
          ? "settings.material.burningAmplitude"
          : "settings.material.breathingAmplitude"
  )
  const background =
    slot === "background" ? material : appearance?.backgroundMaterial
  const previewImage = control
    ? controlMaterialImage(
        material,
        color,
        glass,
        material === "burning" || material === "particles"
          ? parameters[material]
          : undefined
      )
    : undefined

  return (
    <DialogContent
      className="flex max-h-[calc(100svh-2rem)] flex-col gap-4 sm:max-w-xl"
      showCloseButton={false}
    >
      <DialogHeader>
        <DialogTitle>
          {t("settings.material.editorTitle", {
            placement: label,
            material: t(materialOptions[material].labelKey),
          })}
        </DialogTitle>
      </DialogHeader>
      <AppearancePreviewFrame
        surface="sample"
        ref={slot === "background" ? frame : undefined}
        aria-hidden="true"
        className="relative h-[clamp(5rem,24svh,10rem)] shrink-0"
      >
        {background && background !== "none" && (
          <SettingsMaterialSurface
            placement="background"
            material={background}
            backgroundMask={appearance?.backgroundMask}
            parameters={
              slot === "background"
                ? parameters
                : appearance?.materialParameters?.background
            }
            fairIslePreview={slot === "background" ? preview : undefined}
          />
        )}
        {slot === "sidebar" && (
          <div
            ref={frame}
            className={cn(
              "absolute inset-y-3 left-3 w-2/5 overflow-hidden rounded-(--ui-radius-panel) border border-ui-border-panel shadow-(--ui-shadow-panel)",
              material !== "liquid-glass" && "bg-popover"
            )}
          >
            <SettingsMaterialSurface
              placement="sidebar"
              material={material}
              parameters={parameters}
              fairIslePreview={preview}
            />
            <div className="relative space-y-2 p-3">
              <div className="h-1.5 w-3/4 rounded-full bg-foreground/25" />
              <div className="h-1.5 w-1/2 rounded-full bg-foreground/15" />
              <div className="h-1.5 w-2/3 rounded-full bg-foreground/15" />
            </div>
          </div>
        )}
        {control && (
          <div className="absolute inset-0 grid place-items-center">
            <span
              className={cn(
                "rounded-(--ui-radius-button) px-5 py-2 text-sm",
                settingsControlClassName
              )}
              data-material-control-preview
              style={{ backgroundImage: previewImage }}
            >
              {t("settings.uiAppearance.control")}
            </span>
          </div>
        )}
      </AppearancePreviewFrame>
      <div className="min-h-0 space-y-3 overflow-y-auto px-1">
        {intensityControl && (
          <>
            {material === "star-trails" && (
              <AppearanceTabs
                label={t("settings.material.runningMode")}
                options={starModes}
                value={stars.mode}
                getOptionLabel={(mode) => t(`settings.material.${mode}`)}
                onChange={(mode) =>
                  patch({ "star-trails": { ...stars, mode } })
                }
              />
            )}
            <SettingItem label={intensityLabel} htmlFor={id}>
              <SettingRange
                id={id}
                label={intensityLabel}
                min={material === "star-trails" ? MIN_STAR_TRAIL_SPEED : 0}
                max={
                  material === "star-trails"
                    ? MAX_STAR_TRAIL_SPEED
                    : materialAmplitudeMax
                }
                step={0.1}
                value={
                  material === "star-trails"
                    ? stars.speed
                    : (parameters[material] ?? (control ? 1 : defaultAmplitude))
                }
                onChange={(value) =>
                  material === "star-trails"
                    ? patch({ "star-trails": { ...stars, speed: value } })
                    : patch({ [material]: value })
                }
                accentColor={color}
                editable={false}
                formatValue={(value) => `${Math.round(value * 100)}%`}
              />
            </SettingItem>
          </>
        )}
        {texture && (
          <FairIsleSettingsFields
            color={color}
            value={fairIsle}
            texture={texture}
            onChange={(value) =>
              patch({ "fair-isle": { ...fairIsle, ...value } })
            }
            preview={preview}
            setPreview={setPreview}
            getPreviewFrame={() => ({
              width: frame.current?.clientWidth || 640,
              height: frame.current?.clientHeight || 360,
              offset: { x: 0, y: 0 },
              fit: preview.fit,
            })}
          />
        )}
        {material === "liquid-glass" && (
          <LiquidGlassSettingsFields
            color={color}
            value={glass}
            onChange={(value) =>
              patch({ "liquid-glass": { ...glass, ...value } })
            }
            compact={control}
          />
        )}
      </div>
      <DialogFooter className="shrink-0">
        <DialogClose render={<Button variant="outline" />}>
          {t("settings.common.cancel")}
        </DialogClose>
        <DialogClose
          render={<Button />}
          onClick={() => {
            if (Object.keys(draft).length > 0) onSave(draft)
          }}
        >
          {t("settings.common.save")}
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  )
}
