import { useId, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import MaterialCarousel, {
  type MaterialCarouselHandle,
} from "@/components/settings/personalization/material-carousel"
import MaterialPlacementPreview from "@/components/settings/personalization/material-placement-preview"
import FairIsleSettingsFields from "@/components/settings/personalization/fair-isle-settings"
import LiquidGlassSettingsFields from "@/components/settings/personalization/liquid-glass-settings"
import {
  materialOptions,
  materialPlacements,
  type MaterialAssignments,
  type MaterialPlacement,
} from "@/components/settings/personalization/material-preview-options"
import { useMaterialPreview } from "./material-preview-context"
import SettingItem from "../shared/setting-item"
import { settingsControlSurface } from "../shared/control-styles"
import SettingRange from "../shared/setting-range"
import { createFairIsleTexture } from "@/lib/fair-isle"
import { MAX_STAR_TRAIL_SPEED, MIN_STAR_TRAIL_SPEED } from "@/lib/star-trails"

const defaultAssignments: MaterialAssignments = {
  background: "none",
  card: "none",
  control: "none",
}

export default function MaterialPane() {
  const { t } = useTranslation()
  const id = useId()
  const materialPreview = useMaterialPreview()
  const selected = materialPreview.value
  const selectedOption = materialOptions[selected]
  const [assignments, setAssignments] = useState(defaultAssignments)
  const [catalogExpanded, setCatalogExpanded] = useState(true)
  const catalogId = `${id}-catalog`
  const fairIsleSettings = useHomeSettingsStore((state) => state.fairIsle)
  const setFairIsleSettings = useHomeSettingsStore((state) => state.setFairIsle)
  const liquidGlass = useHomeSettingsStore((state) => state.liquidGlass)
  const setLiquidGlass = useHomeSettingsStore((state) => state.setLiquidGlass)
  const backgroundPreview = useRef<HTMLDivElement>(null)
  const cardPreview = useRef<HTMLDivElement>(null)
  const configurationRef = useRef<HTMLDivElement>(null)
  const carouselRef = useRef<MaterialCarouselHandle>(null)
  const [previewOptions, setPreviewOptions] = useState({
    guides: false,
    fit: false,
  })
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const { seed, motifs, colors, bands, symmetry, mode, stitchSize } =
    fairIsleSettings
  const fairIsleTexture = useMemo(
    () =>
      createFairIsleTexture({ seed, motifs, colors, bands, symmetry, mode }),
    [seed, motifs, colors, bands, symmetry, mode]
  )
  const fairIsle = { texture: fairIsleTexture, stitchSize }
  const [lastPlacement, setLastPlacement] = useState<MaterialPlacement | null>(
    null
  )
  const activePlacement =
    lastPlacement && assignments[lastPlacement] === selected
      ? lastPlacement
      : (materialPlacements.find(
          (placement) => assignments[placement] === selected
        ) ?? null)
  const amplitude = useHomeSettingsStore((state) => state.burningAmplitude)
  const setAmplitude = useHomeSettingsStore(
    (state) => state.setBurningAmplitude
  )
  const entrance = useHomeSettingsStore((state) => state.transitionsEnabled)
  const setEntrance = useHomeSettingsStore(
    (state) => state.setTransitionsEnabled
  )
  const color = useHomeSettingsStore((state) => state.color)
  const starTrails = selected === "star-trails"
  const controlId = starTrails ? "star-trail-speed" : "burning-amplitude"
  const controlValue = starTrails ? materialPreview.starTrailSpeed : amplitude
  const intensityKey = starTrails
    ? "settings.material.runningSpeed"
    : selected === "burning"
      ? "settings.material.burningAmplitude"
      : "settings.material.breathingAmplitude"

  return (
    <div className="relative isolate flex h-full min-h-0 min-w-0 flex-col gap-3">
      <MaterialPlacementPreview
        color={color}
        fairIsle={{ ...fairIsle, ...previewOptions, offset }}
        liquidGlass={liquidGlass}
        backgroundRef={backgroundPreview}
        cardRef={cardPreview}
        onPan={(x, y) =>
          setOffset((previous) => ({ x: previous.x + x, y: previous.y + y }))
        }
        catalogId={catalogId}
        catalogExpanded={catalogExpanded}
        onToggleCatalog={() => setCatalogExpanded((expanded) => !expanded)}
        assignments={assignments}
        onAssign={(placement, style) => {
          setAssignments((current) => ({ ...current, [placement]: style }))
        }}
        onEdit={(placement) => {
          const style = assignments[placement]
          setLastPlacement(placement)
          materialPreview.setValue(style)
          configurationRef.current?.scrollTo({ top: 0 })
          carouselRef.current?.scrollToStyle(style)
        }}
        onReset={() => {
          setAssignments(defaultAssignments)
          setLastPlacement(null)
          setPreviewOptions({ guides: false, fit: false })
          setOffset({ x: 0, y: 0 })
        }}
      />
      <div
        id={catalogId}
        hidden={!catalogExpanded}
        className="min-w-0 shrink-0"
      >
        {catalogExpanded && (
          <MaterialCarousel
            ref={carouselRef}
            value={selected}
            onChange={materialPreview.setValue}
            color={color}
            liquidGlass={liquidGlass}
            fairIsle={{
              ...fairIsle,
              stitchSize: Math.min(fairIsle.stitchSize, 4),
            }}
            configurationId={`${id}-configuration`}
          />
        )}
      </div>
      <div
        ref={configurationRef}
        role="region"
        aria-label={t("settings.material.configuration")}
        hidden={selected === "none"}
        tabIndex={0}
        className="-mr-4 min-h-0 flex-1 [scrollbar-gutter:stable] overflow-y-auto overscroll-contain pr-4 pb-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset sm:-mr-(--ui-padding-window) sm:pr-(--ui-padding-window)"
      >
        <section
          id={`${id}-configuration`}
          aria-label={t(selectedOption.labelKey)}
          className="space-y-4 border-t border-border pt-4"
        >
          {starTrails && (
            <SettingItem
              label={t("settings.material.runningMode")}
              labelId="star-trail-mode-label"
            >
              <ToggleGroup
                aria-labelledby="star-trail-mode-label"
                className={settingsControlSurface}
                value={[materialPreview.starTrailMode]}
                onValueChange={(values) => {
                  const value = values[0]
                  if (value === "dynamic" || value === "static")
                    materialPreview.setStarTrailMode(value)
                }}
              >
                <ToggleGroupItem value="dynamic">
                  {t("settings.material.dynamic")}
                </ToggleGroupItem>
                <ToggleGroupItem value="static">
                  {t("settings.material.static")}
                </ToggleGroupItem>
              </ToggleGroup>
            </SettingItem>
          )}
          {selected === "fair-isle" && (
            <FairIsleSettingsFields
              color={color}
              value={fairIsleSettings}
              texture={fairIsleTexture}
              onChange={(patch) => {
                if (
                  patch.seed !== undefined ||
                  patch.motifs !== undefined ||
                  patch.bands !== undefined ||
                  patch.symmetry !== undefined
                )
                  setOffset({ x: 0, y: 0 })
                setFairIsleSettings(patch)
              }}
              preview={previewOptions}
              setPreview={(next) => {
                if (next.fit !== previewOptions.fit) setOffset({ x: 0, y: 0 })
                setPreviewOptions(next)
              }}
              getPreviewFrame={() => {
                const useCard = activePlacement === "card"
                const frame = useCard
                  ? cardPreview.current
                  : backgroundPreview.current
                return {
                  width: frame?.clientWidth || 640,
                  height: frame?.clientHeight || 360,
                  offset: useCard
                    ? { x: 0, y: 0 }
                    : {
                        x: offset.x,
                        y: offset.y - (frame?.scrollTop ?? 0),
                      },
                  fit: previewOptions.fit,
                }
              }}
            />
          )}
          {selected === "liquid-glass" && (
            <LiquidGlassSettingsFields
              color={color}
              value={liquidGlass}
              onChange={setLiquidGlass}
            />
          )}
          {(selected === "burning" ||
            selected === "particles" ||
            starTrails) && (
            <>
              <SettingItem label={t(intensityKey)} htmlFor={controlId}>
                <SettingRange
                  id={controlId}
                  label={t(intensityKey)}
                  min={starTrails ? MIN_STAR_TRAIL_SPEED : 0}
                  max={starTrails ? MAX_STAR_TRAIL_SPEED : 2}
                  step={0.1}
                  value={controlValue}
                  onChange={(value) => {
                    if (starTrails) materialPreview.setStarTrailSpeed(value)
                    else setAmplitude(value)
                  }}
                  accentColor={color}
                  editable={false}
                  formatValue={(value) => `${Math.round(value * 100)}%`}
                />
              </SettingItem>
              <SettingItem label={t("settings.material.transition")}>
                <Switch
                  aria-label={t("settings.material.transition")}
                  checked={entrance}
                  className={`justify-self-end ${settingsControlSurface} focus-visible:border-ring`}
                  style={{ backgroundColor: entrance ? color : undefined }}
                  onCheckedChange={setEntrance}
                />
              </SettingItem>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
