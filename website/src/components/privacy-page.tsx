import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { privacySectionIds, privacySummaryIds } from "../i18n/types"
import "./privacy-page.css"

export function PrivacyContent() {
  const { t } = useTranslation()
  const [activeSection, setActiveSection] = useState<string>(
    privacySectionIds[0]
  )

  useEffect(() => {
    const updateSection = () => {
      let current: string = privacySectionIds[0]
      for (const id of privacySectionIds) {
        const element = document.getElementById(id)
        if (element && element.getBoundingClientRect().top <= 180) current = id
      }
      setActiveSection(current)
    }
    updateSection()
    window.addEventListener("scroll", updateSection, { passive: true })
    return () => window.removeEventListener("scroll", updateSection)
  }, [])

  return (
    <main className="policy-page">
      <header className="policy-hero">
        <svg className="policy-mark" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M5 1h6v2h2v4h2v8H1V7h2V3h2Zm0 2v4h6V3Zm2 6v4h2V9Z" />
        </svg>
        <h1>{t("privacy.title")}</h1>
        <p>{t("privacy.intro")}</p>
        <time dateTime="2026-09-27">{t("privacy.updatedLabel")}</time>
      </header>

      <section
        className="policy-summary"
        aria-label={t("privacy.summaryLabel")}
      >
        {privacySummaryIds.map((id, index) => (
          <article key={id}>
            <span className="policy-summary-index" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <strong>{t(`privacy.summary.${id}.title`)}</strong>
            <p>{t(`privacy.summary.${id}.text`)}</p>
          </article>
        ))}
      </section>

      <div className="policy-layout">
        <aside>
          <p>{t("privacy.tocLabel")}</p>
          <nav aria-label={t("privacy.tocLabel")}>
            {privacySectionIds.map((id) => (
              <a
                href={`#${id}`}
                key={id}
                aria-current={activeSection === id ? "location" : undefined}
              >
                {t(`privacy.sections.${id}.title`)}
              </a>
            ))}
          </nav>
        </aside>
        <div className="policy-body">
          {privacySectionIds.map((id) => {
            const paragraphs = t(`privacy.sections.${id}.paragraphs`, {
              returnObjects: true,
            }) as string[]
            return (
              <section id={id} key={id} aria-labelledby={`${id}-title`}>
                <h2 id={`${id}-title`}>{t(`privacy.sections.${id}.title`)}</h2>
                {paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            )
          })}
        </div>
      </div>
    </main>
  )
}
