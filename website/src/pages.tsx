import { useState } from "react"
import { SiteFooter, SiteHeader } from "./components/site-frame"
import { LandingContent } from "./components/landing-page"
import { PrivacyContent } from "./components/privacy-page"
import type { AppLanguage, PageId } from "./i18n/language"

type PageProps = {
  language: AppLanguage
  page: PageId
}

export function LandingPage({ language }: PageProps) {
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  return (
    <div className="site-shell landing-shell" data-theme={theme}>
      <LandingContent
        theme={theme}
        setTheme={setTheme}
        footer={<SiteFooter language={language} page="home" />}
      />
    </div>
  )
}

export function PrivacyPage({ language, page }: PageProps) {
  return (
    <div className="site-shell privacy-shell">
      <SiteHeader language={language} page={page} />
      <PrivacyContent />
      <SiteFooter language={language} page="privacy" />
    </div>
  )
}
