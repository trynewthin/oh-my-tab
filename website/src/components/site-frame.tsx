import { useTranslation } from "react-i18next"
import logoUrl from "../../../public/icons/icon-128.png"
import {
  pathFor,
  supportedLanguages,
  type AppLanguage,
  type PageId,
} from "../i18n/language"

const repositoryUrl = "https://github.com/trynewthin/oh-my-tab"
const releaseUrl = `${repositoryUrl}/releases/latest`
const chromeStoreUrl =
  "https://chromewebstore.google.com/detail/oh-my-tab-%C2%B7-%E6%96%B0%E6%A0%87%E7%AD%BE%E9%A1%B5/aihmkimlgdondkkeghfnkiknnocoiioa"

// Each language names itself; never translate these labels.
const languageLabels: Record<AppLanguage, string> = {
  "zh-CN": "中文",
  en: "English",
}

function GitHubIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.59 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49v-1.92c-2.78.62-3.37-1.21-3.37-1.21-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.85.09-.66.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.34 9.34 0 0 1 12 6.69c.85 0 1.69.12 2.49.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.89v3.1c0 .27.18.59.69.49A10.25 10.25 0 0 0 22 12.25C22 6.59 17.52 2 12 2Z"
      />
    </svg>
  )
}

type SiteChromeProps = {
  language: AppLanguage
  page: PageId
}

function LanguageSwitcher({ language, page }: SiteChromeProps) {
  const { t } = useTranslation()

  return (
    <nav className="language-switch" aria-label={t("language.switchLabel")}>
      {supportedLanguages.map((supported) =>
        supported === language ? (
          <span key={supported} lang={supported} aria-current="page">
            {languageLabels[supported]}
          </span>
        ) : (
          <a key={supported} lang={supported} href={pathFor(page, supported)}>
            {languageLabels[supported]}
          </a>
        )
      )}
    </nav>
  )
}

export function SiteHeader({ language, page }: SiteChromeProps) {
  const { t } = useTranslation()
  const homePath = pathFor("home", language)

  return (
    <header className="site-header">
      <a className="brand" href={homePath} aria-label={t("header.brandLabel")}>
        <img src={logoUrl} alt="" />
        <span>Oh My Tab</span>
      </a>
      <nav aria-label={t("header.navLabel")}>
        <a href={`${homePath}#features`}>{t("header.features")}</a>
        <a href={`${homePath}#showcase`}>{t("header.showcase")}</a>
        <a href={pathFor("privacy", language)}>{t("header.privacy")}</a>
      </nav>
      <div className="header-actions">
        <LanguageSwitcher language={language} page={page} />
        <a
          className="header-github"
          href={repositoryUrl}
          aria-label={t("header.githubLabel")}
        >
          <GitHubIcon />
        </a>
        <a className="header-action" href={chromeStoreUrl}>
          {t("header.chromeStore")}
        </a>
      </div>
    </header>
  )
}

const glyphs: Record<string, string[]> = {
  O: ["01110", "11011", "11011", "11011", "11011", "11011", "01110"],
  H: ["11011", "11011", "11011", "11111", "11011", "11011", "11011"],
  M: ["10001", "11011", "11111", "10101", "10001", "10001", "10001"],
  Y: ["11011", "11011", "01110", "00100", "00100", "00100", "00100"],
  T: ["11111", "11111", "00100", "00100", "00100", "00100", "00100"],
  A: ["01110", "11011", "11011", "11111", "11011", "11011", "11011"],
  B: ["11110", "11011", "11011", "11110", "11011", "11011", "11110"],
}

export function SiteFooter() {
  const { t } = useTranslation()

  return (
    <footer className="site-footer">
      <div className="footer-invitation">
        <h2>{t("footer.invitation")}</h2>
        <a
          className="footer-install"
          href={chromeStoreUrl}
          aria-label={t("footer.installLabel")}
        >
          {t("footer.install")} <span aria-hidden="true">↗</span>
        </a>
      </div>
      <a
        className="footer-stage"
        href={repositoryUrl}
        aria-label={t("footer.stageLabel")}
      >
        <svg viewBox="0 0 530 90" role="img" aria-label="OH MY TAB">
          {Array.from("OH MY TAB").flatMap((letter, index) =>
            (glyphs[letter] || []).flatMap((row, y) =>
              Array.from(row).map((pixel, x) =>
                pixel === "1" ? (
                  <rect
                    key={`${index}-${x}-${y}`}
                    x={index * 60 + x * 10}
                    y={y * 10 + 10}
                    width="8"
                    height="8"
                    rx="1.5"
                    style={{
                      animationDelay: `${(index * 5 + x + y) * -0.12}s`,
                    }}
                  />
                ) : null
              )
            )
          )}
        </svg>
      </a>
    </footer>
  )
}

export { chromeStoreUrl, releaseUrl, repositoryUrl }
