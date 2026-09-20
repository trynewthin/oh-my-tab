export const landingDetailIds = [
  "colors",
  "todos",
  "calendar",
  "plant",
] as const

export type LandingDetailId = (typeof landingDetailIds)[number]

export const privacySummaryIds = ["local", "consent", "revoke"] as const

export type PrivacySummaryId = (typeof privacySummaryIds)[number]

export const privacySectionIds = [
  "local-data",
  "network-services",
  "webdav",
  "control",
  "use-and-sharing",
  "contact",
] as const

export type PrivacySectionId = (typeof privacySectionIds)[number]

export type LocalizedText = {
  title: string
  text: string
}

export type SiteResources = {
  language: {
    switchLabel: string
  }
  header: {
    brandLabel: string
    navLabel: string
    features: string
    showcase: string
    privacy: string
    download: string
    chromeStore: string
    githubLabel: string
  }
  footer: {
    invitation: string
    install: string
    installLabel: string
    stageLabel: string
  }
  landing: {
    hero: {
      titleLead: string
      titleTail: string
      chromeStore: string
      release: string
      themeLabel: string
      themeDark: string
      themeLight: string
      previewAltDark: string
      previewAltLight: string
    }
    features: {
      heading: string
      details: Record<LandingDetailId, LocalizedText>
    }
    showcase: {
      heading: string
      organize: LocalizedText
      organizeAlt: string
      widgets: LocalizedText
      widgetsAlt: string
    }
  }
  privacy: {
    title: string
    intro: string
    updatedLabel: string
    summaryLabel: string
    summary: Record<PrivacySummaryId, LocalizedText>
    tocLabel: string
    sections: Record<PrivacySectionId, { title: string; paragraphs: string[] }>
  }
}
