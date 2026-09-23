import GridPane from "./grid-pane"
import LayoutPane from "./layout-pane"
import SearchPane from "./search-pane"
import TopPane from "./top-pane"
import QuickBarPane from "./quick-bar-pane"
import QuickBarPreview from "./quick-bar-preview"
import TraditionalPreview from "./traditional-preview"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

export default function HomeSettings() {
  const layoutMode = useHomeSettingsStore((state) => state.layoutMode)
  return (
    <section className="relative isolate min-h-full space-y-4">
      <LayoutPane />
      {layoutMode === "traditional" && (
        <>
          <TraditionalPreview />
          <TopPane />
          <SearchPane />
        </>
      )}
      {layoutMode === "free" && <QuickBarPreview />}
      {layoutMode === "free" && <QuickBarPane />}
      <GridPane />
    </section>
  )
}
