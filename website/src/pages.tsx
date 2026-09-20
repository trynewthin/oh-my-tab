import { SiteFooter, SiteHeader } from "./components/site-frame"
import { LandingContent } from "./components/landing-page"
import { PrivacyContent } from "./components/privacy-page"
import type { AppLanguage, PageId } from "./i18n/language"

type PageProps = {
  language: AppLanguage
  page: PageId
}

export function LandingPage({ language, page }: PageProps) {
  return (
    <div className="site-shell">
      <SiteHeader language={language} page={page} />
      <LandingContent />
      <SiteFooter />
    </div>
  )
}

export function PrivacyPage({ language, page }: PageProps) {
  return (
    <div className="site-shell">
      <SiteHeader language={language} page={page} />
      <PrivacyContent />
      <SiteFooter />
    </div>
  )
}
