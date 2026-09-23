import AppearancePane from "./appearance-pane"
import FolderPane from "./folder-pane"
import TabsPane from "./tabs-pane"

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
    <section className="relative isolate min-h-full space-y-4">
      <Pane />
    </section>
  )
}
