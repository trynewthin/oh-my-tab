import SearchPane from "./search-pane"
import TopPane from "./top-pane"
import { useTranslation } from "react-i18next"

export default function HomeSettings() {
  const { t } = useTranslation()
  return (
    <section
      className="relative isolate min-h-full space-y-5"
      aria-labelledby="home-settings-title"
    >
      <h2 id="home-settings-title" className="text-base leading-6 font-medium">
        {t("settings.nav.homeTop")}
      </h2>
      <TopPane />
      <SearchPane />
    </section>
  )
}
