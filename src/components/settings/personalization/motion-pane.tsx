import { settingsControlSurface } from "../shared/control-styles"
import EffectStylePicker from "./effect-style-picker"
import { Switch } from "@/components/ui/switch"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

export default function MotionPane() {
  const color = useHomeSettingsStore((state) => state.color)
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
    <>
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
    </>
  )
}
