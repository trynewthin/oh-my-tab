/* eslint-disable react-refresh/only-export-components -- exports a settings view map, not components */
import { lazy, type ReactElement } from "react"
import type { SettingsSection } from "@/lib/settings-sections"
const AboutSettings = lazy(() => import("./about/about-settings"))
const AppSettings = lazy(() => import("./general/app-settings"))
const GeneralSettings = lazy(() => import("./general/general-settings"))
const HomeSettings = lazy(() => import("./home/home-settings"))
const PopupSettings = lazy(() => import("./popup/popup-settings"))
const PersonalizationSettings = lazy(
  () => import("./personalization/personalization-settings")
)
const MaterialPane = lazy(() => import("./personalization/material-pane"))
const SearchEngineSettings = lazy(
  () => import("./search/search-engine-settings")
)

export const settingsViews: Record<SettingsSection, () => ReactElement> = {
  "general-basic": () => <GeneralSettings pane="basic" />,
  "general-data": () => <GeneralSettings pane="data" />,
  "home-top": () => <HomeSettings />,
  "popup-appearance": () => <PopupSettings />,
  "search-engines": () => <SearchEngineSettings />,
  "general-apps": () => <AppSettings />,
  "personalization-appearance": () => (
    <PersonalizationSettings pane="appearance" />
  ),
  "personalization-material": () => <MaterialPane />,
  "personalization-tabs": () => <PersonalizationSettings pane="tabs" />,
  "personalization-tabs-square": () => (
    <PersonalizationSettings pane="tabs-square" />
  ),
  "personalization-folders": () => <PersonalizationSettings pane="folders" />,
  about: () => <AboutSettings />,
}
