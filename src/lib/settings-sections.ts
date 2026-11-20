export const settingsSections = [
  "general-basic",
  "home-top",
  "popup-appearance",
  "search-engines",
  "general-apps",
  "personalization-appearance",
  "settings-appearance",
  "personalization-material",
  "personalization-tabs",
  "personalization-tabs-square",
  "personalization-folders",
  "about",
] as const

export type SettingsSection = (typeof settingsSections)[number]

export const defaultSettingsSection: SettingsSection = "search-engines"

export function isSettingsSection(value: string): value is SettingsSection {
  return (settingsSections as readonly string[]).includes(value)
}
