import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, test, vi } from "vitest"
import MaterialSurface from "@/components/effects/material-surface"
import { LiquidGlassRefraction } from "@/components/effects/liquid-glass-refraction"
import MaterialCarousel from "@/components/settings/personalization/material-carousel"
import MaterialPlacementPreview from "@/components/settings/personalization/material-placement-preview"
import { MaterialPreviewContext } from "@/components/settings/personalization/material-preview-context"
import { materialOptions, type MaterialAssignments } from "@/lib/material"
import {
  applyWorkspaceCommand,
  workspaceCommandSchema,
} from "@/lib/data/commands"
import { defaultConfig, homeSchema } from "@/lib/data/config"
import { createFairIsleTexture } from "@/lib/fair-isle"
import { sanitizeHomeSettings } from "@/lib/home-settings"
import {
  defaultLiquidGlass,
  liquidGlassOptics,
  liquidGlassSchema,
  type LiquidGlassSettings,
} from "@/lib/liquid-glass"
import { createGlassDisplacementMap } from "@/lib/liquid-glass-refraction"

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: (key: string) => key }),
}))

const legacyFrostedOcean = {
  finish: "frost",
  scene: "ocean",
  clarity: 85,
  sheen: false,
} as const
const frostedGlass = liquidGlassSchema.parse(legacyFrostedOcean)
const customizedGlass: LiquidGlassSettings = {
  ...frostedGlass,
  tint: "#6a83b8",
  clarity: 90,
  refraction: 80,
  rimWidth: 75,
  blur: 3,
  saturation: 150,
  sheenIntensity: 42,
  pointerHighlight: true,
  glintIntensity: 52,
  glintSize: 210,
}

test("liquid glass uses the selected tint and finish on cards and controls", () => {
  expect(materialOptions["liquid-glass"].placements).toEqual([
    "card",
    "control",
  ])
  expect(liquidGlassOptics(defaultLiquidGlass)).toMatchObject({
    opacity: 0.2,
    blur: 10,
    refraction: 55,
    sheenIntensity: 19,
    pointerHighlight: true,
  })
  expect(liquidGlassOptics(frostedGlass)).toMatchObject({
    opacity: 0.248,
    tint: "#ffffff",
    blur: 14,
    refraction: 35,
    sheenIntensity: 19,
    pointerHighlight: false,
  })

  const surface = renderToStaticMarkup(
    createElement(MaterialSurface, {
      color: "#3478f6",
      textureId: "glass-preview",
      effectStyle: "liquid-glass",
      liquidGlass: frostedGlass,
      liquidGlassSample: true,
    })
  )
  expect(surface).toContain('data-effect-style="liquid-glass"')
  expect(surface).toContain('data-sheen="false"')
  expect(surface).toContain("--glass-blur:14px")
  expect(surface).toContain('data-sample="true"')
  expect(surface).not.toContain("<svg")
  expect(surface).not.toContain("feDisplacementMap")
})

test("custom optics override the finish defaults on the live surface", () => {
  expect(liquidGlassOptics(customizedGlass)).toMatchObject({
    tint: "#6a83b8",
    refraction: 80,
    blur: 3,
    sheenIntensity: 42,
    pointerHighlight: true,
  })
  const surface = renderToStaticMarkup(
    createElement(MaterialSurface, {
      color: "#3478f6",
      textureId: "glass-preview",
      effectStyle: "liquid-glass",
      liquidGlass: customizedGlass,
      liquidGlassPointerTarget: { current: null },
    })
  )
  expect(surface).toContain('data-sheen="false"')
  expect(surface).toContain("--glass-tint:#6a83b8")
  expect(surface).toContain("--glass-blur:3px")
  expect(surface).toContain("--glass-saturation:150%")
  expect(surface).toContain("--glass-sheen:0.42")
  expect(surface).toContain("--glass-glint-alpha:0.52")
  expect(surface).toContain("--glass-glint-size:210px")
  expect(surface).toContain("liquid-glass-glint")
})

test("glass previews keep the assigned background and leave an unassigned card opaque", () => {
  const texture = createFairIsleTexture()
  const preview = (assignments: MaterialAssignments) =>
    renderToStaticMarkup(
      createElement(
        MaterialPreviewContext.Provider,
        {
          value: {
            value: "liquid-glass",
            setValue: () => {},
            starTrailSpeed: 1,
            setStarTrailSpeed: () => {},
            starTrailMode: "static",
            setStarTrailMode: () => {},
          },
        },
        createElement(MaterialPlacementPreview, {
          assignments,
          color: "#3478f6",
          fairIsle: { texture, stitchSize: 4 },
          liquidGlass: customizedGlass,
          backgroundRef: { current: null },
          cardRef: { current: null },
          catalogId: "test-material-catalog",
          catalogExpanded: false,
          onToggleCatalog: () => {},
          onAssign: () => {},
          onEdit: () => {},
          onPan: () => {},
          onReset: () => {},
        })
      )
    )

  const control = preview({
    background: "fair-isle",
    card: "none",
    control: "liquid-glass",
  })
  expect(control).toContain('data-effect-style="fair-isle"')
  expect(control).toContain('data-effect-style="liquid-glass"')
  expect(control).toContain("border-ui-border-panel bg-card")
  expect(control).not.toContain("bg-card/25")
  expect(control).not.toContain("data-liquid-glass-scene")
  expect(control).not.toContain("material-carousel-glass-backdrop")

  const card = preview({
    background: "fair-isle",
    card: "liquid-glass",
    control: "none",
  })
  expect(card).toContain('data-effect-style="fair-isle"')
  expect(card).toContain('data-effect-style="liquid-glass"')
  expect(card).not.toContain("data-liquid-glass-scene")
  expect(card).not.toContain("material-carousel-glass-backdrop")
})

test("the carousel puts a dedicated backdrop behind the live glass thumbnail", () => {
  const carousel = renderToStaticMarkup(
    createElement(MaterialCarousel, {
      color: "#3478f6",
      fairIsle: { texture: createFairIsleTexture(), stitchSize: 4 },
      liquidGlass: customizedGlass,
      value: "liquid-glass",
      onChange: () => {},
      configurationId: "material-configuration",
    })
  )
  expect(carousel).toMatch(
    /material-carousel-glass-backdrop[^>]*><\/div><div[^>]*><div[^>]*data-effect-style="liquid-glass"/
  )
  expect(carousel).not.toContain('data-sample="true"')
})

test("glass refraction bends the backdrop inward at each edge and leaves the center neutral", () => {
  const geometry = {
    width: 160,
    height: 80,
    radius: 12,
  }
  const { pixels, columns, rows } = createGlassDisplacementMap({
    ...geometry,
    rimWidth: 50,
  })
  const pixel = (x: number, y: number) => {
    const start = (y * columns + x) * 4
    return [...pixels.slice(start, start + 4)]
  }

  expect(pixel(columns / 2, rows / 2)).toEqual([128, 128, 0, 255])
  const left = pixel(0, rows / 2)
  const right = pixel(columns - 1, rows / 2)
  expect(left[0]).toBeGreaterThan(230)
  expect(right[0]).toBeLessThan(26)
  expect(left.slice(1)).toEqual(right.slice(1))
  expect(pixel(columns / 2, 0)[1]).toBeGreaterThan(230)
  expect(pixel(columns / 2, rows - 1)[1]).toBeLessThan(26)
  const topLeft = pixel(5, 5)
  expect(topLeft[0]).toBeGreaterThan(128)
  expect(topLeft[0]).toBe(topLeft[1])
  expect(
    createGlassDisplacementMap({
      width: 640,
      height: 160,
      radius: 20,
      rimWidth: 50,
    }).columns
  ).toBe(256)
  const narrow = createGlassDisplacementMap({ ...geometry, rimWidth: 25 })
  const wide = createGlassDisplacementMap({ ...geometry, rimWidth: 75 })
  const pixelInsideEdge = (columns * (rows / 2) + 12) * 4
  expect(narrow.pixels[pixelInsideEdge]).toBe(128)
  expect(wide.pixels[pixelInsideEdge]).toBeGreaterThan(128)

  const filter = renderToStaticMarkup(
    createElement(LiquidGlassRefraction, {
      id: "glass-test",
      blur: 10,
      strength: 80,
      image: {
        width: 160,
        height: 80,
        radius: 12,
        href: "data:image/png;base64,map",
      },
    })
  )
  expect(filter).toContain(
    '<feDisplacementMap in="SourceGraphic" in2="glass-map"'
  )
  expect(filter).toContain('xChannelSelector="R" yChannelSelector="G"')
  expect(filter).toContain('scale="64"')
  expect(filter).toContain('<feMergeNode in="glass-edge"')
})

test("liquid glass settings survive workspace updates and default for older configurations", () => {
  const existing = defaultConfig()
  expect(
    sanitizeHomeSettings(
      homeSchema.parse({ ...existing.home, liquidGlass: undefined })
    ).liquidGlass
  ).toEqual(defaultLiquidGlass)
  const imported = homeSchema.parse({
    ...existing.home,
    liquidGlass: { ...customizedGlass, scene: legacyFrostedOcean.scene },
  })
  expect(imported.liquidGlass).not.toHaveProperty("scene")
  expect(sanitizeHomeSettings(imported).liquidGlass).toEqual(customizedGlass)
  expect(
    sanitizeHomeSettings(
      homeSchema.parse({ ...existing.home, liquidGlass: legacyFrostedOcean })
    ).liquidGlass
  ).toEqual(frostedGlass)
  const command = workspaceCommandSchema.parse({
    type: "settings.patch",
    patch: { liquidGlass: customizedGlass },
  })
  const updated = applyWorkspaceCommand(existing, command)
  expect(
    sanitizeHomeSettings(homeSchema.parse(updated.home)).liquidGlass
  ).toEqual(customizedGlass)
  expect(
    applyWorkspaceCommand(
      updated,
      workspaceCommandSchema.parse({
        type: "settings.patch",
        patch: { liquidGlass: defaultLiquidGlass },
      })
    ).home.liquidGlass
  ).toEqual(defaultLiquidGlass)
  expect(
    liquidGlassSchema.safeParse({ ...customizedGlass, refraction: 101 }).success
  ).toBe(false)
})
