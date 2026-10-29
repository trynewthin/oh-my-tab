import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, test } from "vitest"
import MaterialSurface from "@/components/effects/material-surface"

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
