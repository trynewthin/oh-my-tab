import { createInstance } from "i18next"
import { initReactI18next } from "react-i18next"
import { defaultLanguage, type AppLanguage } from "./language"
import en from "./locales/en"
import zhCN from "./locales/zh-CN"

const resources = {
  "zh-CN": { translation: zhCN },
  en: { translation: en },
}

const i18n = createInstance()

/**
 * The URL owns language on the website, so the entry point resolves it first
 * and passes it in. React components read it with `useTranslation`.
 */
export function initI18n(language: AppLanguage = defaultLanguage) {
  i18n.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: defaultLanguage,
    supportedLngs: ["zh-CN", "en"],
    defaultNS: "translation",
    ns: ["translation"],
    interpolation: { escapeValue: false },
    initAsync: false,
    returnNull: false,
  })
}
