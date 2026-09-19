import AppearancePane from "./appearance-pane"
import BackgroundSettings from "./background-settings"
import MotionPane from "./motion-pane"
import TabsPane from "./tabs-pane"

const paneTitle = {
  appearance: "外观",
  tabs: "标签",
  background: "背景",
  motion: "动效",
} as const

const panes = {
  appearance: AppearancePane,
  tabs: TabsPane,
  background: BackgroundSettings,
  motion: MotionPane,
} as const

export default function PersonalizationSettings({
  pane,
}: {
  pane: keyof typeof panes
}) {
  const Pane = panes[pane]
  return (
    <section
      aria-labelledby="personalization-title"
      className="relative isolate min-h-full space-y-5"
    >
      <h2
        id="personalization-title"
        className="text-base leading-6 font-medium"
      >
        {paneTitle[pane]}
      </h2>
      <Pane />
    </section>
  )
}
