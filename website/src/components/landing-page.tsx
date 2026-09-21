import { useState } from "react"
import { useTranslation } from "react-i18next"
import { landingDetailIds, type LandingDetailId } from "../i18n/types"
import { chromeStoreUrl, releaseUrl } from "./site-frame"

type DetailVisual = {
  image: "detail-colors" | "detail-todos" | "detail-calendar" | "detail-plant"
  tone: string
}

// Each detail card uses a dedicated tightly-framed capture — cropping a wide
// screenshot used to leak neighbouring tiles' borders into the frame.
const detailVisuals: Record<LandingDetailId, DetailVisual> = {
  colors: { image: "detail-colors", tone: "lilac" },
  todos: { image: "detail-todos", tone: "blue" },
  calendar: { image: "detail-calendar", tone: "rose" },
  plant: { image: "detail-plant", tone: "green" },
}

export function LandingContent() {
  const { t } = useTranslation()
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-copy">
          <h1>
            {t("landing.hero.titleLead")}
            <span>{t("landing.hero.titleTail")}</span>
          </h1>
          <div className="hero-actions">
            <a className="button button--primary" href={chromeStoreUrl}>
              {t("landing.hero.chromeStore")}
            </a>
            <a className="button button--quiet" href={releaseUrl}>
              {t("landing.hero.release")}
            </a>
          </div>
        </div>
        <div className="preview-toolbar">
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
              ☾ {t("landing.hero.themeDark")}
            </button>
            <button
              type="button"
              aria-pressed={theme === "light"}
              onClick={() => setTheme("light")}
            >
              ☼ {t("landing.hero.themeLight")}
            </button>
          </div>
        </div>
        <div className={`hero-visual hero-visual--${theme}`}>
          <div className="browser-bar" aria-hidden="true">
            <i />
            <i />
            <i />
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
      </section>

      <section className="feature-section" id="features">
        <div className="section-heading">
          <h2>{t("landing.features.heading")}</h2>
        </div>
        <div className="detail-grid">
          {landingDetailIds.map((id) => {
            const visual = detailVisuals[id]
            const title = t(`landing.features.details.${id}.title`)
            return (
              <article
                className={`detail-card detail-card--${visual.tone}`}
                key={id}
              >
                <div className="detail-art">
                  <img
                    loading="lazy"
                    src={`/showcase/${visual.image}.webp`}
                    alt={title}
                  />
                </div>
                <div className="detail-copy">
                  <h3>{title}</h3>
                  <p>{t(`landing.features.details.${id}.text`)}</p>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="showcase-section" id="showcase">
        <div className="section-heading section-heading--split">
          <div>
            <h2>{t("landing.showcase.heading")}</h2>
          </div>
        </div>
        <div className="showcase-list">
          <article className="showcase-item">
            <div className="showcase-copy">
              <h3>{t("landing.showcase.organize.title")}</h3>
              <p>{t("landing.showcase.organize.text")}</p>
            </div>
            <div className="showcase-shot">
              <img
                loading="lazy"
                width="2400"
                height="920"
                src="/showcase/organize.webp"
                alt={t("landing.showcase.organizeAlt")}
              />
            </div>
          </article>
          <article className="showcase-item showcase-item--reverse">
            <div className="showcase-copy">
              <h3>{t("landing.showcase.widgets.title")}</h3>
              <p>{t("landing.showcase.widgets.text")}</p>
            </div>
            <div className="showcase-shot">
              <img
                loading="lazy"
                width="2400"
                height="920"
                src="/showcase/widgets.webp"
                alt={t("landing.showcase.widgetsAlt")}
              />
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}
