import SearchPane from "./search-pane"
import TopPane from "./top-pane"

export default function HomeSettings() {
  return (
    <section
      className="relative isolate min-h-full space-y-5"
      aria-labelledby="home-settings-title"
    >
      <h2 id="home-settings-title" className="text-base leading-6 font-medium">
        顶部
      </h2>
      <TopPane />
      <SearchPane />
    </section>
  )
}
