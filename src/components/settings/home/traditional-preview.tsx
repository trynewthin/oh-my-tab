import { useLayoutEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import DotMatrix from "@/components/dot-matrix/dot-matrix"
import SearchPrompt from "@/components/search/search-prompt"
import { traditionalTopInsets } from "@/lib/home-top-spacing"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

// Lay out at the track's 768px maximum, then scale the whole composition;
// scaling cells individually would distort their relative sizes.
const TRACK_WIDTH = 768
const FRAME_WIDTH = TRACK_WIDTH + 48

export default function TraditionalPreview() {
  const { t } = useTranslation()
  const container = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  const topComponent = useHomeSettingsStore((state) => state.topComponent)
  const traditionalTopSpacing = useHomeSettingsStore(
    (state) => state.traditionalTopSpacing
  )
  const topInsets = traditionalTopInsets(
    traditionalTopSpacing,
    topComponent === "dot-matrix"
  )

  useLayoutEffect(() => {
    const element = container.current
    const preview = contentRef.current
    if (!element || !preview) return
    const update = () => {
      setScale(
        Math.min(
          1,
          element.clientWidth / FRAME_WIDTH,
          element.clientHeight / preview.offsetHeight
        )
      )
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    observer.observe(preview, { box: "border-box" })
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={container}
      data-traditional-preview
      role="group"
      aria-label={t("settings.home.traditionalPreview")}
      className="relative size-full"
    >
      <div
        ref={contentRef}
        data-home-ui
        aria-hidden="true"
        inert
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 pb-6"
        style={{
          width: FRAME_WIDTH,
          paddingTop: topInsets.topPadding,
          transform: `scale(${scale})`,
        }}
      >
        {topComponent === "dot-matrix" && <DotMatrix preview />}
        <SearchPrompt
          preview
          width={TRACK_WIDTH}
          topGap={topInsets.searchGap}
        />
      </div>
    </div>
  )
}
