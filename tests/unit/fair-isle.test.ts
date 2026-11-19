import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, test } from "vitest"
import MaterialSurface from "@/components/effects/material-surface"
import {
  applyWorkspaceCommand,
  workspaceCommandSchema,
} from "@/lib/data/commands"
import { defaultConfig, homeSchema } from "@/lib/data/config"
import { sanitizeHomeSettings } from "@/lib/home-settings"
import { createFairIsleTexture } from "@/lib/fair-isle"
import {
  defaultFairIsleSettings,
  fairIslePaletteIds,
  fairIslePalettes,
  fairIslePatternIds,
  fairIslePatterns,
  type FairIsleSettings,
} from "@/lib/fair-isle-settings"

test("Fair Isle presets produce complete repeat tiles with at most two yarns in each row", () => {
  for (const pattern of fairIslePatternIds) {
    for (const palette of fairIslePaletteIds) {
      const { backgroundImage, columns, rows, featureRow } =
        createFairIsleTexture({
          ...defaultFairIsleSettings,
          motifs: [...fairIslePatterns[pattern]],
          colors: [...fairIslePalettes[palette]],
        })
      const prefix = 'url("data:image/svg+xml,'
      const svg = decodeURIComponent(backgroundImage.slice(prefix.length, -2))
      const colors = Array.from({ length: rows }, () => new Set<number>())
      const stitches = new Array<number>(rows).fill(0)
      for (const [, yarn, path] of svg.matchAll(
        /fill="url\(#p(\d+)\)" d="([^"]*)"/g
      )) {
        for (const [, , y, width] of path.matchAll(
          /M(\d+) (\d+)h(\d+)v1H\d+z/g
        )) {
          colors[Number(y)].add(Number(yarn))
          stitches[Number(y)] += Number(width)
        }
      }
      expect(featureRow).toBeGreaterThan(0)
      expect(featureRow).toBeLessThan(rows)
      expect(stitches.every((count) => count === columns)).toBe(true)
      expect(colors.every((row) => row.size <= 2)).toBe(true)
      expect(colors[0]).toEqual(new Set([0]))
      expect(colors[rows - 1]).toEqual(colors[0])
    }
  }
})

test("the Fair Isle surface repeats the selected material at the requested stitch size", () => {
  const texture = createFairIsleTexture({
    ...defaultFairIsleSettings,
    motifs: [...fairIslePatterns.snow],
    colors: [...fairIslePalettes.nordic],
  })
  expect(texture.backgroundImage).not.toBe(
    createFairIsleTexture().backgroundImage
  )
  const html = renderToStaticMarkup(
    createElement(MaterialSurface, {
      color: "#3478f6",
      textureId: "fair-isle-preview",
      effectStyle: "fair-isle",
      fairIsle: { texture, stitchSize: 5 },
    })
  )
  expect(html).toContain('data-effect-style="fair-isle"')
  expect(html).toContain("bg-repeat")
  expect(html).toContain("background-size:480px ")
  expect(html).toContain("data:image/svg+xml,")
})

test("custom Fair Isle settings survive a workspace patch and existing home documents use defaults", () => {
  const home = defaultConfig().home
  const legacyHome = { ...home, fairIsle: undefined }
  expect(sanitizeHomeSettings(homeSchema.parse(legacyHome)).fairIsle).toEqual(
    defaultFairIsleSettings
  )

  const custom: FairIsleSettings = {
    ...defaultFairIsleSettings,
    pattern: "custom",
    motifs: ["deer", "heart"],
    palette: "custom",
    colors: ["#243545", "#FAECDF", "#CC7569"],
    seed: "CUSTOM-123",
    stitchSize: 15,
    bands: 8,
    symmetry: true,
    mode: "chart",
  }
  const command = workspaceCommandSchema.parse({
    type: "settings.patch",
    patch: { fairIsle: custom },
  })
  const updated = applyWorkspaceCommand(defaultConfig(), command)
  expect(sanitizeHomeSettings(homeSchema.parse(updated.home)).fairIsle).toEqual(
    custom
  )
  expect(createFairIsleTexture(custom)).toEqual(
    createFairIsleTexture({ ...custom })
  )
  expect(createFairIsleTexture(custom).svg).toContain('fill="url(#grid)"')
  expect(createFairIsleTexture({ ...custom, mode: "flat" }).svg).not.toContain(
    'fill="url(#grid)"'
  )
  expect(createFairIsleTexture({ ...custom, seed: "OTHER" }).svg).not.toBe(
    createFairIsleTexture(custom).svg
  )
})
