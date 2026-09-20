import AppearancePane from "./appearance-pane"
import FolderPane from "./folder-pane"
import TabsPane from "./tabs-pane"
import { useTranslation } from "react-i18next"

const paneTitleKeys = {
  appearance: "settings.nav.personalizationAppearance",
  tabs: "settings.nav.personalizationTabs",
  folders: "settings.nav.personalizationFolders",
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
  const { t } = useTranslation()
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
        {t(paneTitleKeys[pane])}
      </h2>
      <Pane />
    </section>
  )
}
