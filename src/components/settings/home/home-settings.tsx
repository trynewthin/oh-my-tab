import SearchPane from "./search-pane"
import TopPane from "./top-pane"

const paneTitle = {
  top: "顶部",
  search: "搜索框",
} as const

const panes = {
  top: TopPane,
  search: SearchPane,
} as const

export default function HomeSettings({ pane }: { pane: keyof typeof panes }) {
  const Pane = panes[pane]
  return (
    <section
      className="relative isolate min-h-full space-y-5"
      aria-labelledby="home-settings-title"
    >
      <h2 id="home-settings-title" className="text-base leading-6 font-medium">
        {paneTitle[pane]}
      </h2>
      <Pane />
    </section>
  )
}
