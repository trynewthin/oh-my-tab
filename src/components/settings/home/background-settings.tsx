import SettingItem from "../shared/setting-item"
import {
  settingsControlClassName,
  settingsControlSurface,
} from "../shared/control-styles"
import { putAsset } from "@/lib/storage"
import { useImageAsset } from "@/lib/use-image-asset"
import { useState } from "react"
import { i18n } from "@/i18n"
import { useTranslation } from "react-i18next"
import { ImageSquare } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { backgroundPalettes } from "@/lib/background-palettes"
import {
  useHomeSettingsStore,
  type BackgroundType,
} from "@/stores/home-settings-store"
import { toast } from "@/stores/toast-store"

const backgroundTypes = [
  { value: "solid", labelKey: "settings.background.solid" },
  { value: "image", labelKey: "settings.background.image" },
] as const

async function prepareImage(file: File) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new Error(i18n.t("settings.background.invalidType"))
  if (file.size > 50 * 1024 * 1024)
    throw new Error(i18n.t("settings.background.tooLarge"))
  const bitmap = await createImageBitmap(file)
  bitmap.close()
  return putAsset(file)
}

function ImageBackgroundPicker() {
  const { t } = useTranslation()
  const image = useHomeSettingsStore((state) => state.backgroundImage)
  const imageUrl = useImageAsset(image)
  const setImage = useHomeSettingsStore((state) => state.setBackgroundImage)
  const [busy, setBusy] = useState(false)

  return (
    <Button
      variant="outline"
      render={<label />}
      className={`relative w-full cursor-pointer justify-between overflow-hidden ${settingsControlClassName}`}
      aria-disabled={busy}
    >
      {image ? (
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      ) : (
        <ImageSquare className="size-4" />
      )}
      <span className="relative z-10 truncate text-xs">
        {busy
          ? t("settings.common.processing")
          : image
            ? t("settings.background.changeImage")
            : t("settings.background.chooseImage")}
      </span>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        disabled={busy}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          event.currentTarget.value = ""
          if (!file) return
          setBusy(true)
          void prepareImage(file)
            .then(setImage)
            .catch((error) =>
              toast(
                error instanceof Error
                  ? error.message
                  : t("settings.background.processFailed"),
                "error"
              )
            )
            .finally(() => setBusy(false))
        }}
      />
    </Button>
  )
}

export default function BackgroundSettings() {
  const { t } = useTranslation()
  const backgroundType = useHomeSettingsStore((state) => state.backgroundType)
  const setBackgroundType = useHomeSettingsStore(
    (state) => state.setBackgroundType
  )
  const backgroundPalette = useHomeSettingsStore(
    (state) => state.backgroundPalette
  )
  const setBackgroundPalette = useHomeSettingsStore(
    (state) => state.setBackgroundPalette
  )

  return (
    <>
      <SettingItem
        label={t("settings.background.current")}
        labelId="background-type-label"
      >
        <ToggleGroup
          aria-labelledby="background-type-label"
          className={settingsControlSurface}
          value={[backgroundType]}
          onValueChange={(values) => {
            const value = values[0] as BackgroundType | undefined
            if (backgroundTypes.some((option) => option.value === value))
              setBackgroundType(value!)
          }}
        >
          {backgroundTypes.map((option) => (
            <ToggleGroupItem key={option.value} value={option.value}>
              {t(option.labelKey)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </SettingItem>
      {backgroundType === "solid" ? (
        <SettingItem
          label={t("settings.background.color")}
          labelId="background-color-label"
        >
          <ToggleGroup
            aria-labelledby="background-color-label"
            className={`justify-between gap-1 p-1 ${settingsControlSurface}`}
            value={[backgroundPalette]}
            onValueChange={(values) => {
              const value = values[0]
              const palette = backgroundPalettes.find(
                (option) => option.id === value
              )
              if (palette) setBackgroundPalette(palette.id)
            }}
          >
            {backgroundPalettes.map((palette) => (
              <ToggleGroupItem
                key={palette.id}
                value={palette.id}
                aria-label={t(palette.labelKey)}
                title={t(palette.labelKey)}
                data-background-swatch
                className="size-6 flex-none rounded-full border-2 border-foreground/10 p-0 shadow-sm aria-pressed:border-foreground"
                style={
                  {
                    "--background-swatch-light": palette.light,
                    "--background-swatch-dark": palette.dark,
                  } as React.CSSProperties
                }
              >
                <span className="sr-only">{t(palette.labelKey)}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </SettingItem>
      ) : (
        <SettingItem label={t("settings.background.imageLabel")}>
          <ImageBackgroundPicker />
        </SettingItem>
      )}
    </>
  )
}
