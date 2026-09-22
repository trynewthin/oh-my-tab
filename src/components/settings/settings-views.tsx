import type { ReactElement } from "react"
import type { SettingsSection } from "@/lib/settings-sections"
import AboutSettings from "./about/about-settings"
import GeneralSettings from "./general/general-settings"
import HomeSettings from "./home/home-settings"
import PersonalizationSettings from "./personalization/personalization-settings"
import SearchEngineSettings from "./search/search-engine-settings"

export const settingsViews: Record<SettingsSection, () => ReactElement> = {
  "general-basic": () => <GeneralSettings pane="basic" />,
  "general-data": () => <GeneralSettings pane="data" />,
  "home-top": () => <HomeSettings />,
  "search-engines": SearchEngineSettings,
  "personalization-appearance": () => (
    <PersonalizationSettings pane="appearance" />
  ),
  "personalization-tabs": () => <PersonalizationSettings pane="tabs" />,
  "personalization-folders": () => <PersonalizationSettings pane="folders" />,
  "about-project": () => <AboutSettings pane="project" />,
  "about-privacy": () => <AboutSettings pane="privacy" />,
}
