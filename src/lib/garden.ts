import type { EcosystemItem, GardenPlant } from "@/components/tab-grid/types"
export const HOUR = 3600000
export function plantSeed(plant: GardenPlant) {
  return (plant.seed ?? Math.floor(plant.plantedAt) + plant.slot * 997) >>> 0
}
export function randomGene(seed: number, index: number) {
  let value = (seed + Math.imul(index + 1, 374761393)) | 0
  value = Math.imul(value ^ (value >>> 13), 1274126177)
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296
}
export function growth(plant: GardenPlant, now: number) {
  const duration =
    (72 + Math.floor(randomGene(plantSeed(plant), 0) * 49)) * HOUR
  const progress = Math.min(
    1,
    Math.max(0, now - plant.plantedAt + (plant.boost ?? 0)) / duration
  )
  const level = Math.min(4, Math.floor(progress * 4))
  return {
    progress,
    level,
    mature: progress === 1,
    experience: progress === 1 ? 100 : Math.floor((progress * 4 - level) * 100),
  }
}
export function pointProgress(item: EcosystemItem, now: number) {
  const elapsed = Math.max(0, now - (item.pointsUpdatedAt ?? now))
  return Math.floor(((elapsed % HOUR) / HOUR) * 100)
}
export function settleGarden(item: EcosystemItem, now: number): EcosystemItem {
  const anchor = item.pointsUpdatedAt ?? now
  const earned = Math.floor(Math.max(0, now - anchor) / HOUR)
  return {
    ...item,
    points: (item.points ?? 6) + earned,
    pointsUpdatedAt: anchor + earned * HOUR,
    album: item.album ?? [],
  }
}
export function careForPlant(
  item: EcosystemItem,
  action: "water" | "feed",
  now: number
) {
  const next = settleGarden(item, now)
  const plant = next.plants[0]
  const cost = action === "water" ? 1 : 2
  if (!plant || growth(plant, now).mature || next.points! < cost) return null
  next.points! -= cost
  next.plants = [
    {
      ...plant,
      boost: (plant.boost ?? 0) + (action === "water" ? 6 : 18) * HOUR,
    },
    ...next.plants.slice(1),
  ]
  return settleGarden(next, now)
}
export function validGardenPlant(value: unknown): value is GardenPlant {
  if (!value || typeof value !== "object") return false
  const p = value as GardenPlant
  return (
    (p.appearanceVersion === undefined || p.appearanceVersion === 2) &&
    Number.isInteger(p.slot) &&
    p.slot >= 0 &&
    p.slot < 8 &&
    Number.isFinite(p.plantedAt) &&
    p.plantedAt >= 0 &&
    ["flowers", "ferns"].includes(p.species) &&
    (p.seed === undefined ||
      (Number.isInteger(p.seed) && p.seed >= 0 && p.seed <= 4294967295)) &&
    (p.name === undefined ||
      (typeof p.name === "string" && p.name.length <= 40)) &&
    (p.boost === undefined || (Number.isFinite(p.boost) && p.boost >= 0)) &&
    (p.rewardedLevel === undefined ||
      (Number.isInteger(p.rewardedLevel) &&
        p.rewardedLevel >= 0 &&
        p.rewardedLevel <= 4))
  )
}

export function plantName(plant: GardenPlant) {
  if (plant.name?.trim() && plant.name !== "未命名植物") return plant.name
  const seed = plantSeed(plant)
  const first = [
    "晴",
    "暮",
    "月",
    "星",
    "云",
    "雨",
    "霜",
    "晓",
    "青",
    "暖",
    "风",
    "露",
  ]
  const last = [
    "芽",
    "葵",
    "铃",
    "苔",
    "穗",
    "棠",
    "枝",
    "禾",
    "萤",
    "蕊",
    "叶",
    "兰",
  ]
  return (
    first[Math.floor(randomGene(seed, 40) * first.length)] +
    last[Math.floor(randomGene(seed, 41) * last.length)]
  )
}

export function gardenDay(now: number) {
  const date = new Date(now)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}
export function checkInGarden(item: EcosystemItem, now: number) {
  const day = gardenDay(now)
  if (item.lastCheckIn && item.lastCheckIn >= day) return null
  const next = settleGarden(item, now)
  return { ...next, points: next.points! + 100, lastCheckIn: day }
}

export const plantFamily = (seed: number) =>
  Math.floor(randomGene(seed, 50) * 6)

export function generateGardenSeed(
  history: GardenPlant[],
  entropy = crypto.getRandomValues(new Uint32Array(1))[0]
) {
  const unique = [
    ...new Map(
      history.map((plant) => [`${plantSeed(plant)}-${plant.plantedAt}`, plant])
    ).values(),
  ].sort((a, b) => a.plantedAt - b.plantedAt)
  const counts = Array<number>(6).fill(0)
  unique.forEach((plant) => counts[plantFamily(plantSeed(plant))]++)
  const recent = new Set(
    unique.slice(-2).map((plant) => plantFamily(plantSeed(plant)))
  )
  const eligible = counts.map((_, i) => i).filter((i) => !recent.has(i))
  const minimum = Math.min(...eligible.map((i) => counts[i]))
  const targets = new Set(eligible.filter((i) => counts[i] === minimum))
  const used = new Set(unique.map(plantSeed))
  let best = entropy >>> 0
  let bestScore = -Infinity
  for (let attempt = 0; attempt < 1024; attempt++) {
    const candidate = (entropy + Math.imul(attempt + 1, 2654435761)) >>> 0
    if (!targets.has(plantFamily(candidate)) || used.has(candidate)) continue
    const relatives = unique
      .filter((p) => plantFamily(plantSeed(p)) === plantFamily(candidate))
      .slice(-8)
    const score = relatives.length
      ? Math.min(
          ...relatives.map((p) =>
            [1, 2, 3, 4, 5, 51, 52].reduce(
              (sum, index) =>
                sum +
                Math.abs(
                  randomGene(candidate, index) - randomGene(plantSeed(p), index)
                ),
              0
            )
          )
        )
      : randomGene(candidate, 60)
    if (score > bestScore) {
      best = candidate
      bestScore = score
    }
  }
  return best
}
