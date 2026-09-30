import { useId } from "react"
import { useTranslation } from "react-i18next"

export type PreviewTheme = "dark" | "light"

export function ProductPreview({
  theme,
  onThemeChange,
}: {
  theme: PreviewTheme
  onThemeChange: (theme: PreviewTheme) => void
}) {
  const { t } = useTranslation()
  const previewId = useId()

  return (
    <figure className="product-preview" data-theme={theme}>
      <figcaption className="preview-toolbar">
        <span className="preview-label">
          <span className="preview-mark" aria-hidden="true" />
          {t("landing.hero.themeLabel")}
        </span>
        <div
          className="theme-switch"
          role="group"
          aria-label={t("landing.hero.themeLabel")}
        >
          {(["dark", "light"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={theme === option}
              aria-controls={previewId}
              onClick={() => onThemeChange(option)}
            >
              <span aria-hidden="true">{option === "dark" ? "☾" : "☼"}</span>
              {t(
                option === "dark"
                  ? "landing.hero.themeDark"
                  : "landing.hero.themeLight"
              )}
            </button>
          ))}
        </div>
      </figcaption>
      <div className="hero-visual" id={previewId}>
        <div className="browser-bar" aria-hidden="true">
          <i />
          <i />
          <i />
          <span>Oh My Tab</span>
        </div>
        <div className="preview-images">
          {(["dark", "light"] as const).map((option) => (
            <img
              key={option}
              className={`preview-image preview-image--${option}`}
              width="2400"
              height="1840"
              src={`/showcase/home-${option}.webp`}
              fetchPriority={theme === option ? "high" : "low"}
              decoding="async"
              aria-hidden={theme !== option}
              alt={
                theme === option
                  ? t(
                      option === "dark"
                        ? "landing.hero.previewAltDark"
                        : "landing.hero.previewAltLight"
                    )
                  : ""
              }
            />
          ))}
        </div>
      </div>
    </figure>
  )
}
