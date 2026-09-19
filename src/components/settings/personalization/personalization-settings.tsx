import AppearancePane from "./appearance-pane"
import FolderPane from "./folder-pane"
import TabsPane from "./tabs-pane"

const paneTitle = {
  appearance: "外观",
  tabs: "标签",
  folders: "文件夹",
} as const

const panes = {
  appearance: AppearancePane,
  tabs: TabsPane,
  folders: FolderPane,
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
