import GridPane from "./grid-pane"
import SearchPane from "./search-pane"
import TopPane from "./top-pane"

export default function HomeSettings() {
  return (
    <section className="relative isolate min-h-full space-y-5">
      <GridPane />
      <TopPane />
      <SearchPane />
    </section>
  )
}
