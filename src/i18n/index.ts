import i18next from "i18next"
import { initReactI18next } from "react-i18next"

import enCore from "./locales/en/core"
import enGrid from "./locales/en/grid"
import enSettings from "./locales/en/settings"
import enShell from "./locales/en/shell"
import enWidgets, {
  utilityComponents as enUtilityComponents,
} from "./locales/en/widgets"
import zhCore from "./locales/zh-CN/core"
import zhGrid from "./locales/zh-CN/grid"
import zhSettings from "./locales/zh-CN/settings"
import zhShell from "./locales/zh-CN/shell"
import zhWidgets, {
  utilityComponents as zhUtilityComponents,
} from "./locales/zh-CN/widgets"
import {
  APP_LANGUAGES,
  FALLBACK_LANGUAGE,
  browserLanguages,
  resolveAppLanguage,
} from "./language"

// Each module mounts under a top-level key inside the `translation` namespace:
// `core.ts` -> `core.*`, `grid.ts` -> `grid.*`, and so on.
export const resources = {
  "zh-CN": {
    translation: {
      core: zhCore,
      settings: zhSettings,
      grid: {
        ...zhGrid,
        component: { ...zhGrid.component, ...zhUtilityComponents },
      },
      shell: zhShell,
      widgets: zhWidgets,
    },
  },
  en: {
    translation: {
      core: enCore,
      settings: enSettings,
      grid: {
        ...enGrid,
        component: { ...enGrid.component, ...enUtilityComponents },
      },
      shell: enShell,
      widgets: enWidgets,
    },
  },
}

// Bundled resources initialize synchronously; the persisted preference is
// applied after hydration by startLanguageSync.
void i18next.use(initReactI18next).init({
  resources,
  lng: resolveAppLanguage("system", browserLanguages()),
  fallbackLng: FALLBACK_LANGUAGE,
  supportedLngs: APP_LANGUAGES,
  defaultNS: "translation",
  ns: ["translation"],
  initAsync: false,
  returnNull: false,
  interpolation: { escapeValue: false },
})

export const i18n = i18next
export default i18n
