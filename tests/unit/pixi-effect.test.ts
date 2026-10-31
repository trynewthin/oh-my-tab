import { afterEach, expect, test, vi } from "vitest"
import { createPixiEffect } from "@/components/effects/pixi-effect"
import { burningCell } from "@/components/effects/burning-texture"
import {
  textureGrid,
  type TextureGrid,
} from "@/components/effects/texture-grid"

const mocks = vi.hoisted(() => ({
  ready: Promise.resolve({}),
  release: vi.fn(),
  present: vi.fn(),
}))

vi.mock("@/lib/pixi/shared-renderer", () => ({
  acquirePixiRenderer: () => ({ ready: mocks.ready, release: mocks.release }),
  presentPixi: mocks.present,
}))

vi.mock("pixi.js", () => ({
  Container: class {
    children: unknown[] = []
    addChild(child: unknown) {
      this.children.push(child)
    }
    removeChildren() {
      return this.children.splice(0)
    }
    destroy() {}
  },
  Sprite: class {
    visible = true
    alpha = 1
    position = { set: vi.fn() }
    destroy() {}
  },
  Texture: { WHITE: {} },
}))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

test("initializes the texture with the latest width when a folder changes columns while loading", async () => {
  let releaseRenderer!: (renderer: object) => void
  mocks.ready = new Promise((resolve) => {
    releaseRenderer = resolve
  })
  const canvas = {
    style: { cssText: "" },
    dataset: {},
    width: 0,
    height: 0,
    setAttribute: vi.fn(),
    remove: vi.fn(),
  }
  const fallback = { style: { visibility: "visible" } }
  const region = { firstElementChild: fallback, append: vi.fn() }
  vi.stubGlobal("document", { hidden: false, createElement: () => canvas })
  const seed = 183477
  const color = "#abcdef"
  const initial = textureGrid(332, 44)
  const columnsChanged = textureGrid(170, 44)
  const effect = createPixiEffect(
    region as unknown as HTMLElement,
    "#3478f6",
    seed,
    initial,
    0,
    "burning"
  )

  function expectTexture(geometry: TextureGrid) {
    const stage = mocks.present.mock.lastCall![1] as {
      children: { visible: boolean; alpha: number }[]
    }
    expect(stage.children).toHaveLength(geometry.columns * geometry.rows)
    stage.children.forEach((sprite, index) => {
      const fill = burningCell(
        color,
        seed,
        index % geometry.columns,
        Math.floor(index / geometry.columns),
        geometry.columns
      )
      const alpha = fill.match(/ ([\d.e-]+)%/)
      expect(sprite.visible).toBe(alpha !== null)
      if (alpha) expect(sprite.alpha).toBeCloseTo(Number(alpha[1]) / 100)
    })
  }

  try {
    effect.update(color, columnsChanged)
    releaseRenderer({})
    await vi.waitFor(() => expect(mocks.present).toHaveBeenCalled())
    expectTexture(columnsChanged)
    const resizedAgain = textureGrid(107, 55)
    effect.update(color, resizedAgain)
    expectTexture(resizedAgain)
  } finally {
    effect.dispose()
  }
  expect(mocks.release).toHaveBeenCalledTimes(1)
  expect(fallback.style.visibility).toBe("visible")
})
