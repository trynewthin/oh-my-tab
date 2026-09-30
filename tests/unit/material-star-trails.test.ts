import { createElement, type ReactElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, test, vi } from "vitest"
import MaterialPane from "@/components/settings/personalization/material-pane"
import MaterialSurface from "@/components/effects/material-surface"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import type { MaterialPreviewContextValue } from "@/components/settings/personalization/material-preview-context"

const { preview } = vi.hoisted(() => ({
  preview: {
    value: "star-trails",
    setValue: vi.fn(),
    starTrailSpeed: 1.4,
    setStarTrailSpeed: vi.fn(),
    starTrailMode: "dynamic" as "dynamic" | "static",
    setStarTrailMode: vi.fn(),
  } satisfies MaterialPreviewContextValue,
}))

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock(
  "@/components/settings/personalization/material-preview-context",
  () => ({
    useMaterialPreview: () => preview,
  })
)

vi.mock("@/components/settings/personalization/effect-style-picker", () => ({
  default: ({ includeStarTrails }: { includeStarTrails?: boolean }) =>
    createElement("div", {
      "data-star-trails-option": String(includeStarTrails),
    }),
}))

vi.mock("@/stores/home-settings-store", async (importOriginal) => {
  const { useHomeSettingsStore } =
    await importOriginal<typeof import("@/stores/home-settings-store")>()
  return {
    useHomeSettingsStore: Object.assign(
      (
        selector: (
          state: ReturnType<typeof useHomeSettingsStore.getState>
        ) => unknown
      ) => selector(useHomeSettingsStore.getState()),
      useHomeSettingsStore
    ),
  }
})

function findControl(
  node: ReactNode,
  id: string
):
  | ReactElement<{
      id: string
      onChange: (event: { target: { value: string } }) => void
      onValueChange: (values: string[]) => void
      disabled?: boolean
    }>
  | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findControl(child, id)
      if (match) return match
    }
    return
  }
  if (!node || typeof node !== "object" || !("props" in node)) return
  const element = node as ReactElement<{
    id?: string
    "aria-labelledby"?: string
    children?: ReactNode
  }>
  if (element.props.id === id || element.props["aria-labelledby"] === id)
    return element as ReturnType<typeof findControl>
  return findControl(element.props.children, id)
}

beforeEach(() => {
  vi.clearAllMocks()
  preview.starTrailMode = "dynamic"
  useHomeSettingsStore.setState({ burningAmplitude: 0.6 })
})

describe("material star trails", () => {
  test("shows running speed and routes slider changes to the star-trail preview", () => {
    const content = MaterialPane()
    const html = renderToStaticMarkup(content)
    expect(html).toContain('data-star-trails-option="true"')
    expect(html).toContain("settings.material.runningSpeed")
    expect(html).toContain('id="star-trail-speed"')
    expect(html).toContain('min="0" max="2"')
    expect(html).toContain("140%")
    expect(html).toContain("settings.material.transition")
    expect(html).not.toContain("settings.material.breathingAmplitude")

    const input = findControl(content, "star-trail-speed")
    expect(input).toBeDefined()
    input!.props.onChange({ target: { value: "0.5" } })
    expect(preview.setStarTrailSpeed).toHaveBeenCalledWith(0.5)
    expect(useHomeSettingsStore.getState().burningAmplitude).toBe(0.6)
  })

  test("offers Dynamic and Static modes and allows zero speed while static", () => {
    const content = MaterialPane()
    const html = renderToStaticMarkup(content)
    expect(html).toContain("settings.material.runningMode")
    expect(html).toContain("settings.material.dynamic")
    expect(html).toContain("settings.material.static")
    const mode = findControl(content, "star-trail-mode-label")
    expect(mode).toBeDefined()
    mode!.props.onValueChange(["static"])
    expect(preview.setStarTrailMode).toHaveBeenCalledWith("static")

    preview.starTrailMode = "static"
    const staticContent = MaterialPane()
    const input = findControl(staticContent, "star-trail-speed")
    expect(input).toBeDefined()
    expect(input!.props.disabled).not.toBe(true)
    expect(renderToStaticMarkup(staticContent)).toContain("140%")
    input!.props.onChange({ target: { value: "0" } })
    expect(preview.setStarTrailSpeed).toHaveBeenCalledWith(0)
    expect(useHomeSettingsStore.getState().burningAmplitude).toBe(0.6)
  })

  test("renders the star-trail layer on the original dialog background", () => {
    const html = renderToStaticMarkup(
      createElement(MaterialSurface, {
        color: "#3478f6",
        textureId: "settings-material-background",
        effectStyle: "star-trails",
        speed: 1.4,
        transparent: true,
        animated: true,
        visible: true,
      })
    )
    expect(html).toContain('data-effect-style="star-trails"')
    expect(html).toContain('data-star-trail-speed="1.4"')
    expect(html).toContain("<canvas")
    expect(html).not.toContain("bg-card")
    expect(html).not.toContain("background-color:")
  })
})
