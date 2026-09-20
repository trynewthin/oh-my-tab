import { i18n } from "@/i18n"
import { resolveAppLanguage } from "@/i18n/language"
import { useLocaleStore } from "@/stores/locale-store"

// Applies the persisted preference to i18next and the document, and keeps them
// in sync. Both entries call this after hydration and before render.
export function startLanguageSync(page: "newTab" | "popup") {
  const titleKey =
    page === "newTab" ? "core.app.newTabTitle" : "core.app.popupTitle"

  const applyDocument = () => {
    document.documentElement.lang = i18n.language
    document.title = i18n.t(titleKey)
  }

  const apply = () => {
    const language = resolveAppLanguage(useLocaleStore.getState().preference)
    if (i18n.language === language) applyDocument()
    // changeLanguage emits "languageChanged" synchronously for bundled
    // resources, which applies the document state in one place.
    else void i18n.changeLanguage(language)
  }

  i18n.on("languageChanged", applyDocument)
  apply()

  const unsubscribeStore = useLocaleStore.subscribe(apply)
  const onLanguageChange = () => {
    if (useLocaleStore.getState().preference === "system") apply()
  }
  window.addEventListener("languagechange", onLanguageChange)

  return () => {
    i18n.off("languageChanged", applyDocument)
    unsubscribeStore()
    window.removeEventListener("languagechange", onLanguageChange)
  }
}
