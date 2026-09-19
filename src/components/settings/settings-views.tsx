import AboutSettings from "./about/about-settings"
import GeneralSettings from "./general/general-settings"
import HomeSettings from "./home/home-settings"
import PersonalizationSettings from "./personalization/personalization-settings"
import SearchEngineSettings from "./search/search-engine-settings"
import { defaultSettingsSection as defaultRouteId } from "./settings-routes"

export const settingsViews = {
  "general-basic": () => <GeneralSettings pane="basic" />,
  "general-data": () => <GeneralSettings pane="data" />,
  "home-top": () => <HomeSettings pane="top" />,
  "home-search": () => <HomeSettings pane="search" />,
  "search-engines": SearchEngineSettings,
  "personalization-appearance": () => (
    <PersonalizationSettings pane="appearance" />
  ),
  "personalization-background": () => (
    <PersonalizationSettings pane="background" />
  ),
  "personalization-motion": () => <PersonalizationSettings pane="motion" />,
  "about-project": () => <AboutSettings pane="project" />,
  "about-privacy": () => <AboutSettings pane="privacy" />,
} as const

export type SettingsSection = keyof typeof settingsViews

export const defaultSettingsSection = defaultRouteId as SettingsSection

export function isSettingsSection(value: string): value is SettingsSection {
  return Object.hasOwn(settingsViews, value)
}
