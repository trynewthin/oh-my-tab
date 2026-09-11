import ColorPicker from "@/components/ui/color-picker"
import EffectStylePicker from "@/components/settings/effect-style-picker"
import { Switch } from "@/components/ui/switch"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useThemeStore } from "@/stores/theme-store"
import { backgroundPalettes } from "@/lib/background-palettes"
import { Desktop, Moon, Sun } from "@phosphor-icons/react"

const themeOptions = [
  { value: "light", label: "浅色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
  { value: "system", label: "系统", ariaLabel: "跟随系统", icon: Desktop },
] as const

export default function PersonalizationSettings() {
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)
  const backgroundPalette = useHomeSettingsStore(
    (state) => state.backgroundPalette
  )
  const setBackgroundPalette = useHomeSettingsStore(
    (state) => state.setBackgroundPalette
  )
  const color = useHomeSettingsStore((state) => state.color)
  const setColor = useHomeSettingsStore((state) => state.setColor)
  const effectStyle = useHomeSettingsStore((state) => state.effectStyle)
  const setEffectStyle = useHomeSettingsStore((state) => state.setEffectStyle)
  const amplitude = useHomeSettingsStore((state) => state.burningAmplitude)
  const setAmplitude = useHomeSettingsStore(
    (state) => state.setBurningAmplitude
  )
  const entrance = useHomeSettingsStore((state) => state.transitionsEnabled)
  const setEntrance = useHomeSettingsStore(
    (state) => state.setTransitionsEnabled
  )
  return (
    <section
      aria-labelledby="personalization-title"
      className="relative isolate min-h-full"
    >
      <h2 id="personalization-title" className="sr-only">
        个性化
      </h2>
      <div className="space-y-8">
        <section className="space-y-5" aria-labelledby="color-settings-title">
          <h3
            id="color-settings-title"
            className="flex items-center gap-2 text-sm font-medium"
          >
            <span
              aria-hidden="true"
              className="h-4 w-1 rounded-full"
              style={{ backgroundColor: color }}
            />
            色彩
          </h3>
          <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
            <span className="text-sm">主题色</span>
            <ColorPicker
              label="主题色"
              value={color}
              onChange={setColor}
              className="bg-muted dark:bg-muted"
            />
          </div>
          <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
            <span id="theme-mode-label" className="text-sm">
              深浅色模式
            </span>
            <ToggleGroup
              aria-labelledby="theme-mode-label"
              value={[theme]}
              onValueChange={(values) => {
                const value = values[0]
                if (value === "light" || value === "dark" || value === "system")
                  setTheme(value)
              }}
            >
              {themeOptions.map((option) => (
                <ToggleGroupItem
                  key={option.value}
                  value={option.value}
                  aria-label={
                    "ariaLabel" in option ? option.ariaLabel : option.label
                  }
                  title={
                    "ariaLabel" in option ? option.ariaLabel : option.label
                  }
                >
                  <option.icon />
                  <span>{option.label}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
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
        </section>
        <section className="space-y-5" aria-labelledby="motion-settings-title">
          <h3
            id="motion-settings-title"
            className="flex items-center gap-2 text-sm font-medium"
          >
            <span
              aria-hidden="true"
              className="h-4 w-1 rounded-full"
              style={{ backgroundColor: color }}
            />
            动效
          </h3>
          <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
            <span className="text-sm">
              粒子效果
            </span>
            <EffectStylePicker
              value={effectStyle}
              color={color}
              onChange={setEffectStyle}
            />
          </div>
          {effectStyle !== "none" && (
            <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
              <label htmlFor="burning-amplitude" className="text-sm">
                {effectStyle === "burning" ? "燃烧幅度" : "呼吸幅度"}
              </label>
              <div className="flex h-8 min-w-0 items-center gap-2 rounded-2xl border border-border bg-muted px-3">
                <input
                  id="burning-amplitude"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={amplitude}
                  onChange={(event) => setAmplitude(Number(event.target.value))}
                  className="min-w-0 flex-1"
                  style={{ accentColor: color }}
                />
                <output
                  htmlFor="burning-amplitude"
                  className="w-10 text-right text-xs tabular-nums"
                >
                  {Math.round(amplitude * 100)}%
                </output>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
            <span className="text-sm">过渡效果</span>
            <Switch
              aria-label="过渡效果"
              checked={entrance}
              className="justify-self-end"
              style={{ backgroundColor: entrance ? color : undefined }}
              onCheckedChange={setEntrance}
            />
          </div>
        </section>
      </div>
    </section>
  )
}
