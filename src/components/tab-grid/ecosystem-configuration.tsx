import GardenAlbum from "./garden-album"
import { useGardenStore } from "@/stores/garden-store"
import { generateGardenSeed } from "@/lib/garden"
import { pointProgress, gardenDay, checkInGarden } from "@/lib/garden"
import { plantName } from "@/lib/garden"
import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Ecosystem from "./ecosystem"
import type { EcosystemItem, GardenPlant } from "./types"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { careForPlant, growth, settleGarden, plantSeed } from "@/lib/garden"
import { toast } from "@/stores/toast-store"

export default function EcosystemConfiguration({
  item,
  onClose,
}: {
  item?: EcosystemItem
  onClose: () => void
  onSaved: () => void
}) {
  const [id] = useState(() => item?.id ?? crypto.randomUUID())
  const stored = useTabGridStore((state) =>
    state.items.find((entry) => entry.id === id)
  )
  const [now, setNow] = useState(() => Date.now())
  const shared = useGardenStore()
  const [albumOpen, setAlbumOpen] = useState(false)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  const empty: EcosystemItem = {
    id,
    kind: "ecosystem",
    size: "large",
    name: "像素花盆",
    color: "#42b883",
    species: "flowers",
    plants: [],
    points: 6,

    album: [],
  }
  const value = settleGarden(
    { ...(stored?.kind === "ecosystem" ? stored : (item ?? empty)), ...shared },
    now
  )
  const plant = value.plants[0]
  const status = plant ? growth(plant, now) : null
  function current() {
    const latest = useTabGridStore
      .getState()
      .items.find((entry) => entry.id === id)
    return settleGarden(
      {
        ...(latest?.kind === "ecosystem" ? latest : (item ?? empty)),
        ...useGardenStore.getState(),
      },
      now
    )
  }
  function save(next: EcosystemItem) {
    const { points, pointsUpdatedAt, album, lastCheckIn } = next
    useGardenStore.setState({
      points: points!,
      pointsUpdatedAt: pointsUpdatedAt!,
      album: album ?? [],
      lastCheckIn,
    })
    useTabGridStore.getState().saveItem({
      id: next.id,
      kind: "ecosystem",
      name: next.name,
      color: next.color,
      size: "large",
      species: next.species,
      plants: next.plants,
    })
  }
  function care(action: "water" | "feed") {
    const next = careForPlant(current(), action, now)
    if (next) save(next)
  }
  function archive() {
    const next = current(),
      active = next.plants[0]
    if (!active || !growth(active, now).mature) return
    const album = [...(next.album ?? [])]
    if (
      !album.some(
        (p) =>
          plantSeed(p) === plantSeed(active) && p.plantedAt === active.plantedAt
      )
    )
      album.push(active)
    save({ ...next, plants: next.plants.slice(1), album })
    toast("已收纳到图鉴", "success")
  }
  function display(saved: GardenPlant) {
    const next = current()
    if (next.plants.some((p) => !growth(p, now).mature)) return
    const album = [...(next.album ?? [])]
    for (const p of next.plants)
      if (
        !album.some(
          (entry) =>
            plantSeed(entry) === plantSeed(p) && entry.plantedAt === p.plantedAt
        )
      )
        album.push(p)
    save({ ...next, plants: [{ ...saved, slot: 4, rewardedLevel: 4 }], album })
    setAlbumOpen(false)
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>像素花盆</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] items-start gap-4">
          <div className="min-w-0">
            <div className="relative aspect-square">
              {plant && (
                <Input
                  key={`${plantSeed(plant)}-${plant.plantedAt}`}
                  aria-label="植物名称"
                  className="absolute top-0 left-1/2 z-10 w-2/3 -translate-x-1/2 text-center"
                  defaultValue={plantName(plant)}
                  maxLength={40}
                  onBlur={(event) => {
                    const next = current()
                    if (!next.plants[0]) return
                    const name =
                      event.target.value.trim() ||
                      plantName({ ...plant, name: undefined })
                    save({
                      ...next,
                      plants: next.plants.map((p, i) =>
                        i === 0 ? { ...p, name } : p
                      ),
                      album: next.album?.map((p) =>
                        plantSeed(p) === plantSeed(plant) &&
                        p.plantedAt === plant.plantedAt
                          ? { ...p, name }
                          : p
                      ),
                    })
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur()
                  }}
                />
              )}

              {status && (
                <div
                  className="absolute inset-x-0 top-10 z-10 text-center text-xs text-muted-foreground"
                  aria-label="植物生长进度"
                >
                  {`Lv.${status.level + 1} · ${["萌芽", "幼苗", "生长", "花期", "成熟"][status.level]} · ${Math.floor(status.progress * 100)}%`}
                </div>
              )}
              <Ecosystem item={value} preview />
            </div>
          </div>
          <div
            className="flex flex-col gap-2 self-stretch"
            role="toolbar"
            aria-label="植物养护"
          >
            <Button
              className="w-full"
              variant="outline"
              onClick={() => setAlbumOpen(true)}
            >
              图鉴
            </Button>
            <Button
              variant="outline"
              disabled={!plant || status?.mature || value.points! < 2}
              title="加速生长 18 小时"
              onClick={() => care("feed")}
            >
              施肥
            </Button>
            <Button
              variant="outline"
              disabled={!plant || status?.mature || value.points! < 1}
              title="加速生长 6 小时"
              onClick={() => care("water")}
            >
              浇水
            </Button>

            <Button
              variant="outline"
              disabled={value.plants.length > 0}
              onClick={() => {
                const next = current()
                if (next.plants.length) return
                save({
                  ...next,
                  plants: [
                    {
                      slot: 4,
                      plantedAt: now,
                      species: "flowers",
                      seed: generateGardenSeed([
                        ...(next.album ?? []),
                        ...next.plants,
                      ]),
                      appearanceVersion: 2,

                      boost: 0,
                      rewardedLevel: 0,
                    },
                  ],
                })
              }}
            >
              播种
            </Button>
            {status?.mature && <Button onClick={archive}>收入图鉴</Button>}
            <div className="mt-auto w-full pt-4">
              <span className="mb-1.5 block text-center text-xs text-muted-foreground">
                点数 {value.points}
              </span>
              <div
                role="progressbar"
                aria-label="点数积攒进度"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pointProgress(value, now)}
                title="每小时积累 1 点"
                className="relative flex h-8 w-full items-center justify-center overflow-hidden rounded-full border bg-muted text-xs"
              >
                <div
                  className="absolute inset-y-0 left-0 bg-primary/20 transition-[width] duration-500"
                  style={{ width: `${pointProgress(value, now)}%` }}
                />
                <span className="relative">{pointProgress(value, now)}%</span>
              </div>
              <Button
                className="mt-2 w-full"
                variant="outline"
                disabled={
                  !!value.lastCheckIn && value.lastCheckIn >= gardenDay(now)
                }
                onClick={() => {
                  const next = checkInGarden(current(), now)
                  if (!next) return
                  save(next)
                  toast("签到成功，获得 100 点", "success")
                }}
              >
                {value.lastCheckIn && value.lastCheckIn >= gardenDay(now)
                  ? "今日已签到"
                  : "每日签到"}
              </Button>
            </div>
          </div>
        </div>
        {albumOpen && (
          <GardenAlbum
            value={value}
            canDisplay={!value.plants.some((p) => !growth(p, now).mature)}
            onDisplay={display}
            onClose={() => setAlbumOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
