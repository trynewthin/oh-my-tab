import GardenAlbum from "./garden-album"
import { useGardenStore } from "@/stores/garden-store"
import {
  careForPlant,
  checkInGarden,
  gardenDay,
  generateGardenSeed,
  growth,
  plantName,
  plantSeed,
  plantStageName,
  pointProgress,
  settleGarden,
} from "@/lib/garden"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SettingItem from "@/components/settings/shared/setting-item"
import ComponentEditorFrame from "./component-editor-frame"
import Ecosystem from "./ecosystem"
import type { EcosystemItem, GardenPlant } from "@/lib/grid/types"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { toast } from "@/stores/toast-store"
import {
  componentDefaultName,
  componentDescription,
  componentLabel,
  getComponentDefinition,
  getComponentSize,
} from "@/lib/grid/registry"
import { useTranslation } from "react-i18next"

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
  const { t } = useTranslation()
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  const empty: EcosystemItem = {
    id,
    kind: "ecosystem",
    size: "large",
    name: componentDefaultName("ecosystem", t),
    color: getComponentDefinition("ecosystem").defaultColor,
    species: "flowers",
    plants: [],
    points: 6,

    album: [],
  }
  const value = settleGarden(
    { ...(stored?.kind === "ecosystem" ? stored : (item ?? empty)), ...shared },
    now
  )
  const dimensions = getComponentSize("ecosystem", value.size)!
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
    toast(t("grid.ecosystem.archived"), "success")
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
    <>
      <ComponentEditorFrame
        title={componentLabel("ecosystem", t)}
        description={componentDescription("ecosystem", t)}
        width={dimensions.width}
        height={dimensions.height}
        preview={<Ecosystem item={value} preview />}
        previewBorder={false}
        onClose={onClose}
      >
        {plant && (
          <SettingItem
            label={t("grid.ecosystem.plantName")}
            htmlFor="ecosystem-plant-name"
          >
            <Input
              id="ecosystem-plant-name"
              key={`${plantSeed(plant)}-${plant.plantedAt}`}
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
                  plants: next.plants.map((entry, index) =>
                    index === 0 ? { ...entry, name } : entry
                  ),
                  album: next.album?.map((entry) =>
                    plantSeed(entry) === plantSeed(plant) &&
                    entry.plantedAt === plant.plantedAt
                      ? { ...entry, name }
                      : entry
                  ),
                })
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur()
              }}
            />
          </SettingItem>
        )}
        {status && (
          <p
            className="text-xs text-muted-foreground"
            aria-label={t("grid.ecosystem.growthProgress")}
          >
            {t("grid.ecosystem.growthStatus", {
              level: status.level + 1,
              stage: plantStageName(status.level),
              percent: Math.floor(status.progress * 100),
            })}
          </p>
        )}
        <div
          className="flex flex-wrap gap-2"
          role="toolbar"
          aria-label={t("grid.ecosystem.careToolbar")}
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => setAlbumOpen(true)}
          >
            {t("grid.ecosystem.album")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!plant || status?.mature || value.points! < 2}
            title={t("grid.ecosystem.feedTitle")}
            onClick={() => care("feed")}
          >
            {t("grid.ecosystem.feed")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!plant || status?.mature || value.points! < 1}
            title={t("grid.ecosystem.waterTitle")}
            onClick={() => care("water")}
          >
            {t("grid.ecosystem.water")}
          </Button>
          <Button
            type="button"
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
            {t("grid.ecosystem.plant")}
          </Button>
          {status?.mature && (
            <Button type="button" onClick={archive}>
              {t("grid.ecosystem.addToAlbum")}
            </Button>
          )}
        </div>
        <div>
          <span className="mb-1.5 block text-xs text-muted-foreground">
            {t("grid.ecosystem.points", { points: value.points })}
          </span>
          <div
            role="progressbar"
            aria-label={t("grid.ecosystem.pointsProgress")}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pointProgress(value, now)}
            title={t("grid.ecosystem.pointsPerHour")}
            className="relative flex h-8 w-full items-center justify-center overflow-hidden rounded-full border bg-muted text-xs"
          >
            <div
              className="absolute inset-y-0 left-0 bg-primary/20 transition-[width] duration-500"
              style={{ width: `${pointProgress(value, now)}%` }}
            />
            <span className="relative">{pointProgress(value, now)}%</span>
          </div>
          <Button
            type="button"
            className="mt-2 w-full"
            variant="outline"
            disabled={
              !!value.lastCheckIn && value.lastCheckIn >= gardenDay(now)
            }
            onClick={() => {
              const next = checkInGarden(current(), now)
              if (!next) return
              save(next)
              toast(t("grid.ecosystem.checkInSuccess"), "success")
            }}
          >
            {value.lastCheckIn && value.lastCheckIn >= gardenDay(now)
              ? t("grid.ecosystem.checkedInToday")
              : t("grid.ecosystem.checkIn")}
          </Button>
        </div>
      </ComponentEditorFrame>
      {albumOpen && (
        <GardenAlbum
          value={value}
          canDisplay={!value.plants.some((p) => !growth(p, now).mature)}
          onDisplay={display}
          onClose={() => setAlbumOpen(false)}
        />
      )}
    </>
  )
}
