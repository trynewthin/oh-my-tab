import { describe, expect, it } from "vitest"
import { generateGardenSeed, plantFamily } from "@/lib/garden"

describe("garden seed generation", () => {
  it("keeps new plant families balanced and avoids the two most recent", () => {
    const history: {
      slot: number
      seed: number
      plantedAt: number
      species: "flowers"
    }[] = []
    const counts = Array(6).fill(0)
    for (let i = 0; i < 60; i++) {
      const seed = generateGardenSeed(history, (i * 1234567) >>> 0)
      const family = plantFamily(seed)
      expect(
        history.slice(-2).some((p) => plantFamily(p.seed) === family)
      ).toBe(false)
      expect(history.some((p) => p.seed === seed)).toBe(false)
      counts[family]++
      expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1)
      history.push({ slot: 4, seed, plantedAt: i, species: "flowers" })
    }
  })

  it("is deterministic for the same history and entropy", () => {
    expect(generateGardenSeed([], 1234)).toBe(generateGardenSeed([], 1234))
  })
})
