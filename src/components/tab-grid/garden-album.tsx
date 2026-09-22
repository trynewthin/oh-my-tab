import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useGardenStore } from "@/stores/garden-store"
import { plantSeed, plantName } from "@/lib/garden"
import { toast } from "@/stores/toast-store"
import type { EcosystemItem, GardenPlant } from "@/lib/grid/types"
import Ecosystem from "./ecosystem"
import { useTranslation } from "react-i18next"
const keyOf = (plant: GardenPlant) => `${plantSeed(plant)}-${plant.plantedAt}`
export default function GardenAlbum({
  value,
  canDisplay,
  onDisplay,
  onClose,
}: {
  value: EcosystemItem
  canDisplay: boolean
  onDisplay: (plant: GardenPlant) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const album = useGardenStore((state) => state.album)
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  function removeSelected() {
    const current = useGardenStore.getState().album
    const removed = current.filter((plant) => selected.includes(keyOf(plant)))
    if (!removed.length) return
    useGardenStore.setState({
      album: current.filter((plant) => !selected.includes(keyOf(plant))),
    })
    setSelected([])
    toast(
      t("grid.ecosystem.albumRemoved", { count: removed.length }),
      "success",
      {
        label: t("grid.notify.undo"),
        run: () => {
          const latest = useGardenStore.getState().album
          useGardenStore.setState({
            album: [
              ...latest,
              ...removed.filter(
                (plant) =>
                  !latest.some((entry) => keyOf(entry) === keyOf(plant))
              ),
            ].sort((a, b) => a.plantedAt - b.plantedAt),
          })
        },
      }
    )
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="flex max-h-[80svh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader className="pr-32">
          <DialogTitle>{t("grid.ecosystem.albumTitle")}</DialogTitle>
        </DialogHeader>
        <Button
          variant="outline"
          className="absolute top-4 right-14 h-8"
          onClick={() => {
            setSelecting(!selecting)
            setSelected([])
          }}
        >
          {selecting
            ? t("grid.ecosystem.albumDone")
            : t("grid.ecosystem.albumManage")}
        </Button>
        {selecting && (
          <div
            className="flex shrink-0 flex-wrap gap-2"
            role="toolbar"
            aria-label={t("grid.ecosystem.albumToolbar")}
          >
            {selecting && (
              <>
                <Button
                  variant="outline"
                  onClick={() =>
                    setSelected(
                      selected.length === album.length ? [] : album.map(keyOf)
                    )
                  }
                >
                  {selected.length === album.length && album.length
                    ? t("grid.ecosystem.deselectAll")
                    : t("grid.ecosystem.selectAll")}
                </Button>
                <Button
                  variant="destructive"
                  disabled={!selected.length}
                  onClick={removeSelected}
                >
                  {selected.length
                    ? t("grid.ecosystem.albumDelete", {
                        count: selected.length,
                      })
                    : t("grid.bulk.delete")}
                </Button>
              </>
            )}
          </div>
        )}
        <div
          className="min-h-0 overflow-y-auto overscroll-contain pr-2"
          data-album-scroll
        >
          {!album.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("grid.ecosystem.albumEmpty")}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {album.map((plant) => (
                <button
                  key={keyOf(plant)}
                  role={selecting ? "checkbox" : undefined}
                  aria-checked={
                    selecting ? selected.includes(keyOf(plant)) : undefined
                  }
                  aria-label={plantName(plant)}
                  disabled={!selecting && !canDisplay}
                  title={
                    !selecting && !canDisplay
                      ? t("grid.ecosystem.albumSwitchHint")
                      : undefined
                  }
                  onClick={() =>
                    selecting
                      ? setSelected((previous) =>
                          previous.includes(keyOf(plant))
                            ? previous.filter((key) => key !== keyOf(plant))
                            : [...previous, keyOf(plant)]
                        )
                      : onDisplay(plant)
                  }
                  className={`min-w-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${selected.includes(keyOf(plant)) ? "ring-2 ring-primary ring-inset" : ""}`}
                >
                  <div className="aspect-square">
                    <Ecosystem
                      item={{ ...value, plants: [plant] }}
                      preview
                      animated={false}
                    />
                  </div>
                  <span className="block truncate pb-2 text-sm">
                    {plantName(plant)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
