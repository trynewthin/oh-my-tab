import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { LandingPage, PrivacyPage } from "./pages"
import { initI18n } from "./i18n"
import { languageFromPath, pageFromPath } from "./i18n/language"
import "./styles.css"

// The URL owns language and page on the web, so a reload always matches the
// metadata baked into the static HTML entry point.
const language = languageFromPath(window.location.pathname)
const page = pageFromPath(window.location.pathname)

initI18n(language)
document.documentElement.lang = language

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {page === "privacy" ? (
      <PrivacyPage language={language} page={page} />
    ) : (
      <LandingPage language={language} page={page} />
    )}
  </StrictMode>
)
