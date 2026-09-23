import GridPane from "./grid-pane"
import LayoutPane from "./layout-pane"
import SearchPane from "./search-pane"
import TopPane from "./top-pane"

export default function HomeSettings() {
  return (
    <section className="relative isolate min-h-full space-y-4">
      <LayoutPane />
      <GridPane />
      <TopPane />
      <SearchPane />
    </section>
  )
}
