import { useState } from "react"
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
  { value: "solid", label: "纯色" },
  { value: "image", label: "图片" },
] as const

async function prepareImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("请选择图片文件")
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1920 / bitmap.width, 1080 / bitmap.height)
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.82)
  )
  if (!blob) throw new Error("图片处理失败")
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("图片读取失败"))
    reader.readAsDataURL(blob)
  })
  if (data.length > 2_000_000) throw new Error("图片过大，请选择更小的图片")
  return data
}

function ImageBackgroundPicker() {
  const image = useHomeSettingsStore((state) => state.backgroundImage)
  const setImage = useHomeSettingsStore((state) => state.setBackgroundImage)
  const [busy, setBusy] = useState(false)

  return (
    <Button
      variant="outline"
      render={<label />}
      className="relative w-full cursor-pointer justify-between overflow-hidden bg-muted dark:bg-muted"
      aria-disabled={busy}
    >
      {image ? (
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{ backgroundImage: `url(${image})` }}
        />
      ) : (
        <ImageSquare className="size-4" />
      )}
      <span className="relative z-10 truncate text-xs">
        {busy ? "处理中…" : image ? "更换图片" : "选择图片"}
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
                error instanceof Error ? error.message : "图片处理失败",
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
      <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <span id="background-type-label" className="text-sm">
          当前背景
        </span>
        <ToggleGroup
          aria-labelledby="background-type-label"
          value={[backgroundType]}
          onValueChange={(values) => {
            const value = values[0] as BackgroundType | undefined
            if (backgroundTypes.some((option) => option.value === value))
              setBackgroundType(value!)
          }}
        >
          {backgroundTypes.map((option) => (
            <ToggleGroupItem key={option.value} value={option.value}>
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      {backgroundType === "solid" ? (
        <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
          <span id="background-color-label" className="text-sm">
            背景色
          </span>
          <ToggleGroup
            aria-labelledby="background-color-label"
            className="justify-between gap-1 border border-border/60 bg-muted p-1 shadow-inner"
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
                aria-label={palette.label}
                title={palette.label}
                data-background-swatch
                className="size-6 flex-none rounded-full border-2 border-foreground/10 p-0 shadow-sm aria-pressed:border-foreground"
                style={
                  {
                    "--background-swatch-light": palette.light,
                    "--background-swatch-dark": palette.dark,
                  } as React.CSSProperties
                }
              >
                <span className="sr-only">{palette.label}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      ) : (
        <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
          <span className="text-sm">背景图片</span>
          <ImageBackgroundPicker />
        </div>
      )}
    </>
  )
}
