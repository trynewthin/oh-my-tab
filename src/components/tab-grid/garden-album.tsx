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
import type { EcosystemItem, GardenPlant } from "./types"
import Ecosystem from "./ecosystem"
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
    toast(`已删除 ${removed.length} 株图鉴植物`, "success", {
      label: "撤销",
      run: () => {
        const latest = useGardenStore.getState().album
        useGardenStore.setState({
          album: [
            ...latest,
            ...removed.filter(
              (plant) => !latest.some((entry) => keyOf(entry) === keyOf(plant))
            ),
          ].sort((a, b) => a.plantedAt - b.plantedAt),
        })
      },
    })
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
          <DialogTitle>植物图鉴</DialogTitle>
        </DialogHeader>
        <Button
          variant="outline"
          className="absolute top-4 right-14 h-8"
          onClick={() => {
            setSelecting(!selecting)
            setSelected([])
          }}
        >
          {selecting ? "完成" : "批量管理"}
        </Button>
        {selecting && (
          <div
            className="flex shrink-0 flex-wrap gap-2"
            role="toolbar"
            aria-label="图鉴管理"
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
                    ? "取消全选"
                    : "全选"}
                </Button>
                <Button
                  variant="destructive"
                  disabled={!selected.length}
                  onClick={removeSelected}
                >
                  删除{selected.length ? ` ${selected.length}` : ""}
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
              成熟后收入图鉴
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
                      ? "当前植物成熟后可切换"
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
                    <Ecosystem item={{ ...value, plants: [plant] }} preview />
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
