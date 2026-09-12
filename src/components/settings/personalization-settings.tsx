import {
  settingsControlClassName,
  settingsControlSurface,
} from "./control-styles"
import ColorPicker from "@/components/ui/color-picker"
import EffectStylePicker from "@/components/settings/effect-style-picker"
import BackgroundSettings from "@/components/settings/background-settings"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useThemeStore } from "@/stores/theme-store"
import { Desktop, Moon, Sun } from "@phosphor-icons/react"

const themeOptions = [
  { value: "light", label: "浅色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
  { value: "system", label: "系统", ariaLabel: "跟随系统", icon: Desktop },
] as const

export default function PersonalizationSettings() {
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)
  const folderStyle = useHomeSettingsStore((state) => state.folderStyle)
  const setFolderStyle = useHomeSettingsStore((state) => state.setFolderStyle)
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
            外观
          </h3>
          <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
            <span className="text-sm">主题色</span>
            <ColorPicker
              label="主题色"
              value={color}
              onChange={setColor}
              className={settingsControlClassName}
            />
          </div>
          <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
            <span id="theme-mode-label" className="text-sm">
              深浅色模式
            </span>
            <ToggleGroup
              aria-labelledby="theme-mode-label"
              className={settingsControlSurface}
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
            <label htmlFor="folder-style" className="text-sm">
              文件夹样式
            </label>
            <Select
              value={folderStyle}
              onValueChange={(value) => {
                if (
                  value === "classic" ||
                  value === "noise" ||
                  value === "none"
                )
                  setFolderStyle(value)
              }}
            >
              <SelectTrigger
                id="folder-style"
                className={`w-full ${settingsControlClassName}`}
              >
                <SelectValue>
                  {
                    {
                      classic: "经典光晕",
                      noise: "噪点渐变",
                      none: "无效果",
                    }[folderStyle]
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="classic">经典光晕</SelectItem>
                <SelectItem value="noise">噪点渐变</SelectItem>
                <SelectItem value="none">无效果</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>
        <section
          className="space-y-5"
          aria-labelledby="background-settings-title"
        >
          <h3
            id="background-settings-title"
            className="flex items-center gap-2 text-sm font-medium"
          >
            <span
              aria-hidden="true"
              className="h-4 w-1 rounded-full"
              style={{ backgroundColor: color }}
            />
            背景
          </h3>
          <BackgroundSettings />
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
            <span className="text-sm">粒子效果</span>
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
              <div
                className={`flex h-8 min-w-0 items-center gap-2 rounded-2xl px-3 ${settingsControlSurface}`}
              >
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
              className={`justify-self-end ${settingsControlSurface} focus-visible:border-ring`}
              style={{ backgroundColor: entrance ? color : undefined }}
              onCheckedChange={setEntrance}
            />
          </div>
        </section>
      </div>
    </section>
  )
}
