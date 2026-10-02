import { useTranslation } from "react-i18next"
import { chromeStoreUrl, releaseUrl } from "./site-frame"
import { pathFor, supportedLanguages } from "../i18n/language"
import "./opening-act.css"

const fragments = [
  "github",
  "notion",
  "spotify",
  "todos",
  "calendar",
  "plant",
] as const

export function OpeningAct({
  theme,
  setTheme,
}: {
  theme: "dark" | "light"
  setTheme: (theme: "dark" | "light") => void
}) {
  const { t, i18n } = useTranslation()

  return (
    <section
      className="opening-act"
      data-theme={theme}
      aria-labelledby="opening-title"
    >
      <div className="act-stage">
        <div className="act-grid" aria-hidden="true" />
        <div className="act-heading">
          <h1 id="opening-title">
            {t("landing.hero.titleLead")}
            <br />
            <span>{t("landing.hero.titleTail")}</span>
          </h1>
          <div className="act-actions">
            <a className="button button--primary" href={chromeStoreUrl}>
              {t("landing.hero.chromeStore")}
            </a>
            <a className="act-release" href={releaseUrl}>
              {t("landing.hero.release")}
            </a>
          </div>
        </div>
        <div className="act-composition">
          <div className="act-word" aria-hidden="true">
            TAB<span>+</span>
          </div>
          <div className="act-fragments" aria-hidden="true">
            {fragments.map((id) => (
              <div className={`act-fragment act-fragment--${id}`} key={id}>
                <img
                  src={`/showcase/detail-${id}${theme === "light" ? "-light" : ""}.webp`}
                  alt=""
                />
              </div>
            ))}
          </div>
          <div className="act-preview">
            <div className={`hero-visual hero-visual--${theme}`}>
              <div className="browser-bar" aria-hidden="true">
                <i />
                <i />
                <i />
                <span>oh my tab / your little corner of the internet</span>
              </div>
              <img
                width="2400"
                height="1840"
                src={`/showcase/home-${theme}.webp`}
                alt={t(
                  theme === "dark"
                    ? "landing.hero.previewAltDark"
                    : "landing.hero.previewAltLight"
                )}
              />
            </div>
          </div>
        </div>
        <div className="act-bottom">
          <div
            className="theme-switch"
            role="group"
            aria-label={t("landing.hero.themeLabel")}
          >
            <button
              type="button"
              aria-pressed={theme === "dark"}
              onClick={() => setTheme("dark")}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M6 1h4v2H6v2H4v6h2v2h6v-2h2v3h-2v1H5v-2H3v-2H1V5h2V3h3ZM12 3h2v2h-2Z" />
              </svg>
              {t("landing.hero.themeDark")}
            </button>
            <button
              type="button"
              aria-pressed={theme === "light"}
              onClick={() => setTheme("light")}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M7 0h2v3H7ZM7 13h2v3H7ZM0 7h3v2H0ZM13 7h3v2h-3ZM2 2h2v2H2ZM12 2h2v2h-2ZM2 12h2v2H2ZM12 12h2v2h-2ZM6 4h4v2h2v4h-2v2H6v-2H4V6h2Z" />
              </svg>
              {t("landing.hero.themeLight")}
            </button>
          </div>
          <a
            className="act-scroll"
            href="#features"
            aria-label={t("landing.hero.scroll")}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M2 5h4v3h3v3h2V8h3V5h4v4h-3v3h-3v3H8v-3H5V9H2Z" />
            </svg>
          </a>
          <nav className="act-language" aria-label={t("language.switchLabel")}>
            {supportedLanguages.map((language) => (
              <a
                key={language}
                href={pathFor("home", language)}
                lang={language}
                aria-current={
                  i18n.resolvedLanguage === language ? "page" : undefined
                }
              >
                {language === "zh-CN" ? "中文" : "EN"}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </section>
  )
}
