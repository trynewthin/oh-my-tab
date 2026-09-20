export const settingsSections = [
  "general-basic",
  "general-data",
  "home-top",
  "search-engines",
  "personalization-appearance",
  "personalization-tabs",
  "personalization-folders",
  "about-project",
  "about-privacy",
] as const

export type SettingsSection = (typeof settingsSections)[number]

export const defaultSettingsSection: SettingsSection = "search-engines"

export function isSettingsSection(value: string): value is SettingsSection {
  return (settingsSections as readonly string[]).includes(value)
}
