export type TabEntry = {
  id: string
  name: string
  url: string
  size?: "small" | "medium"
  color?: string
  dynamicEffect?: boolean
}

export type TabItem = TabEntry & {
  kind: "tab"
  size: "small" | "medium"
  color: string
}

export type FolderItem = {
  id: string
  kind: "folder"
  name: string
  size: "small" | "large" | "tall"
  color: string
  tabs: TabEntry[]
  dynamicEffect?: boolean
}

export type DotCanvasItem = {
  id: string
  kind: "dot-canvas"
  name: string
  size: "large"
  color: string
  pixels: string[]
  dynamicEffect?: boolean
}

export type GardenPlant = {
  slot: number
  plantedAt: number
  species: "flowers" | "ferns"
  seed?: number
  appearanceVersion?: 2
  name?: string
  boost?: number
  rewardedLevel?: number
}
export type EcosystemItem = {
  id: string
  kind: "ecosystem"
  name: string
  size: "large"
  color: string
  species: "flowers" | "ferns"
  plants: GardenPlant[]
  album?: GardenPlant[]
  points?: number
  pointsUpdatedAt?: number
  lastCheckIn?: string
  dynamicEffect?: boolean
}

export type GridItem = TabItem | FolderItem | DotCanvasItem | EcosystemItem

export function normalizeTabUrl(value: string): string | null {
  try {
    const raw = value.trim()
    if (!raw) return null
    const url = new URL(
      /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`
    )
    return ["http:", "https:"].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}
