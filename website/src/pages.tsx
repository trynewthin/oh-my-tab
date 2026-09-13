import { SiteFooter, SiteHeader } from "./components/site-frame"
import { LandingContent } from "./components/landing-page"
import { PrivacyContent } from "./components/privacy-page"

export function LandingPage() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <LandingContent />
      <SiteFooter />
    </div>
  )
}

export function PrivacyPage() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <PrivacyContent />
      <SiteFooter />
    </div>
  )
}
