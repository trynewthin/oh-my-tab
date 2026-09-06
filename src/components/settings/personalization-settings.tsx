import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import ColorPicker from "@/components/ui/color-picker"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

export default function PersonalizationSettings() {
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
      <h2 id="personalization-title" className="text-base font-medium">
        个性化
      </h2>
      <div className="mt-6 grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <span className="text-sm">主题色</span>
        <ColorPicker label="主题色" value={color} onChange={setColor} />
      </div>
      <div className="mt-5 grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <label htmlFor="effect-style" className="text-sm">
          粒子效果
        </label>
        <Select
          value={effectStyle}
          onValueChange={(value) => {
            if (value === "burning" || value === "particles")
              setEffectStyle(value)
          }}
        >
          <SelectTrigger
            id="effect-style"
            className="w-full border-border bg-popover dark:bg-popover"
          >
            <SelectValue>
              {effectStyle === "burning" ? "方格燃烧" : "浮游粒子"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="burning">方格燃烧</SelectItem>
            <SelectItem value="particles">浮游粒子</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mt-5 grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <label htmlFor="burning-amplitude" className="text-sm">
          {effectStyle === "burning" ? "燃烧幅度" : "粒子幅度"}
        </label>
        <div className="flex h-8 min-w-0 items-center gap-2 rounded-2xl border border-border bg-popover px-3">
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
      <div className="mt-5 grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <span className="text-sm">过渡效果</span>
        <Button
          role="switch"
          aria-label="过渡效果"
          aria-checked={entrance}
          variant="outline"
          className="bg-popover dark:bg-popover dark:hover:bg-muted"
          onClick={() => setEntrance(!entrance)}
        >
          {entrance ? "开启" : "关闭"}
        </Button>
      </div>
    </section>
  )
}
