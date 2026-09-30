import { useState } from "react"
import { useTranslation } from "react-i18next"
import { landingDetailIds, type LandingDetailId } from "../i18n/types"
import { ProductPreview, type PreviewTheme } from "./product-preview"
import { chromeStoreUrl, releaseUrl } from "./site-frame"

type DetailVisual = {
  image: "detail-colors" | "detail-todos" | "detail-calendar" | "detail-plant"
  tone: string
}

// Product captures, not fabricated UI: every detail shown here exists in the
// extension. Keep the dedicated crops so neighbouring tiles never leak in.
const detailVisuals: Record<LandingDetailId, DetailVisual> = {
  colors: { image: "detail-colors", tone: "lilac" },
  todos: { image: "detail-todos", tone: "blue" },
  calendar: { image: "detail-calendar", tone: "rose" },
  plant: { image: "detail-plant", tone: "green" },
}

export function LandingContent() {
  const { t } = useTranslation()
  const [theme, setTheme] = useState<PreviewTheme>("dark")

  return (
    <main className="landing">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="hero-heading">
            <p className="eyebrow">Oh My Tab · Chrome / Edge</p>
            <h1 id="hero-title">
              {t("landing.hero.titleLead")}
              <span>{t("landing.hero.titleTail")}</span>
            </h1>
          </div>
          <div className="hero-actions">
            <a className="button button--primary" href={chromeStoreUrl}>
              {t("landing.hero.chromeStore")}
              <span aria-hidden="true">↗</span>
            </a>
            <a className="button button--quiet" href={releaseUrl}>
              {t("landing.hero.release")}
            </a>
          </div>
        </div>
        <ProductPreview theme={theme} onThemeChange={setTheme} />
      </section>

      <section
        className="feature-section"
        id="features"
        aria-labelledby="features-title"
      >
        <div className="section-heading">
          <span className="section-index" aria-hidden="true">
            01
          </span>
          <h2 id="features-title">{t("landing.features.heading")}</h2>
        </div>
        <div className="detail-grid">
          {landingDetailIds.map((id, index) => {
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
                    decoding="async"
                    src={`/showcase/${visual.image}.webp`}
                    alt={title}
                  />
                </div>
                <div className="detail-copy">
                  <span className="detail-index" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3>{title}</h3>
                    <p>{t(`landing.features.details.${id}.text`)}</p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section
        className="showcase-section"
        id="showcase"
        aria-labelledby="showcase-title"
      >
        <div className="section-heading">
          <span className="section-index" aria-hidden="true">
            02
          </span>
          <h2 id="showcase-title">{t("landing.showcase.heading")}</h2>
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
                decoding="async"
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
                decoding="async"
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
