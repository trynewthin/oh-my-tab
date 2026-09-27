import { ImageSquare, PencilSimple } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import type { UtilityWidgetItem } from "@/lib/grid/utility-types"
import { NOTE_MAX_LENGTH } from "@/lib/widgets/model"
import { updateUtilityWidget } from "@/stores/widget-actions"
import { WidgetEmpty, WidgetSurface, type WidgetProps } from "./surface"

type KindProps<K extends UtilityWidgetItem["kind"]> = WidgetProps<
  Extract<UtilityWidgetItem, { kind: K }>
>

export function NoteTile(props: KindProps<"note">) {
  const { item, preview, sample = preview } = props
  const { t } = useTranslation()
  return (
    <WidgetSurface
      {...props}
      className="utility-note"
      footer={
        <>
          <PencilSimple size={12} aria-hidden="true" />
          <span>{t("widgets.design.onlyHere")}</span>
          {!preview && (
            <span className="utility-note-count">
              {item.text.length.toLocaleString()} /{" "}
              {NOTE_MAX_LENGTH.toLocaleString()}
            </span>
          )}
        </>
      }
    >
      {preview ? (
        <div className="utility-note-text">
          {item.text ||
            (sample ? t("widgets.notePreview") : t("widgets.notePlaceholder"))}
        </div>
      ) : (
        <textarea
          aria-label={item.name}
          value={item.text}
          maxLength={NOTE_MAX_LENGTH}
          placeholder={t("widgets.notePlaceholder")}
          className="utility-note-text utility-focus"
          onKeyDown={(event) => event.stopPropagation()}
          onChange={(event) => {
            const text = event.target.value
            updateUtilityWidget(item.id, (current) =>
              current.kind === "note" ? { ...current, text } : current
            )
          }}
        />
      )}
    </WidgetSurface>
  )
}

/** Locally drawn catalog artwork, not a remotely loaded or user-owned photo. */
function PhotoIllustration() {
  const { t } = useTranslation()
  return (
    <svg
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={t("widgets.design.illustration")}
      className="utility-photo-art"
    >
      <rect width="400" height="400" className="utility-art-sky" />
      <circle cx="290" cy="105" r="38" className="utility-art-sun" />
      <path
        d="M0 285Q85 160 210 250T400 190V400H0Z"
        className="utility-art-far"
      />
      <path
        d="M0 315Q120 205 255 305T400 255V400H0Z"
        className="utility-art-near"
      />
      <path d="M0 360Q190 282 400 350V400H0Z" className="utility-art-front" />
    </svg>
  )
}

export function PhotoTile(props: KindProps<"photo">) {
  const { item, preview, sample = preview, onOpen } = props
  const { t } = useTranslation()
  if (!item.image && !sample)
    return (
      <WidgetSurface {...props} className="utility-photo-empty">
        <WidgetEmpty
          {...props}
          icon={<ImageSquare size={34} weight="light" />}
          title={t("widgets.design.addPhoto")}
          hint={t("widgets.design.photoHint")}
        />
      </WidgetSurface>
    )
  const content = (
    <>
      {item.image ? (
        <img
          src={item.image}
          alt={item.caption || item.name}
          decoding="async"
          loading="lazy"
          draggable={false}
          className={
            item.fit === "contain"
              ? "utility-photo-image utility-photo-contain"
              : "utility-photo-image"
          }
        />
      ) : (
        <PhotoIllustration />
      )}
      {item.caption && (
        <figcaption className="utility-photo-caption">
          <span title={item.caption}>{item.caption}</span>
        </figcaption>
      )}
      {!preview && (
        <button
          type="button"
          className="utility-photo-edit utility-focus"
          onClick={onOpen}
          aria-label={t("widgets.configure")}
          title={t("widgets.configure")}
        >
          <PencilSimple size={15} />
        </button>
      )}
    </>
  )
  return (
    <WidgetSurface {...props} header={false} className="utility-photo">
      <figure>{content}</figure>
    </WidgetSurface>
  )
}
