import { mountPixiGarden } from "./pixi-garden"
import GardenPlantArt from "./garden-plant-art"
import { useEffect, useRef, useState } from "react"
import type { EcosystemItem } from "./types"
import "./ecosystem.css"

export default function Ecosystem({
  item,
  preview = false,
  animated = true,
  onEdit,
}: {
  item: EcosystemItem
  preview?: boolean
  animated?: boolean
  onEdit?: () => void
}) {
  const [now, setNow] = useState(() => Date.now())
  const container = useRef<HTMLDivElement>(null)
  const visible = useRef(true)
  const plantsKey = JSON.stringify(item.plants)
  useEffect(() => {
    const svg = container.current?.querySelector("svg")
    if (svg) return mountPixiGarden(svg, animated)
  }, [plantsKey, now, animated])
  useEffect(() => {
    if (!animated) return
    const element = container.current
    if (!element) return
    let intersects = true
    const update = () => {
      visible.current = intersects && !document.hidden
      element.dataset.gardenPaused = String(!visible.current)
      if (visible.current) setNow(Date.now())
    }
    const observer = new IntersectionObserver(([entry]) => {
      intersects = entry.isIntersecting
      update()
    })
    observer.observe(element)
    document.addEventListener("visibilitychange", update)
    update()
    return () => {
      observer.disconnect()
      document.removeEventListener("visibilitychange", update)
    }
  }, [animated])
  useEffect(() => {
    if (!animated) return
    const timer = window.setInterval(() => {
      if (visible.current) setNow(Date.now())
    }, 60000)
    return () => clearInterval(timer)
  }, [animated])
  const art = (
    <svg
      viewBox="0 0 64 64"
      className="h-full w-full"
      aria-label="像素花盆"
      shapeRendering="crispEdges"
    >
      <g transform="translate(0 6)">
        <path d="M18 39H46V46H44V52H42V56H22V52H20V46H18Z" fill="#8c4939" />
        <path d="M21 42H43V48H41V53H23V48H21Z" fill="#c97955" />
        <path d="M23 43H27V50H29V53H24V49H23Z" fill="#e69b70" />
        <path d="M39 43H43V48H41V53H37V51H39Z" fill="#ad5d44" />
        <path d="M16 36H48V43H16Z" fill="#8c4939" />
        <path d="M18 37H46V40H18Z" fill="#eead80" />
        <path d="M18 40H46V42H18Z" fill="#ce8059" />
        <path d="M20 35H44V38H20Z" fill="#593c32" />
        <path d="M23 35H29V36H23ZM34 36H38V37H34Z" fill="#856046" />
        <g>
          {item.plants.slice(0, 1).map((plant) => (
            <GardenPlantArt
              key={plant.seed ?? plant.plantedAt}
              plant={plant}
              now={now}
            />
          ))}
        </g>
      </g>
    </svg>
  )
  return (
    <div ref={container} data-garden-static={!animated || undefined} className="relative h-full w-full p-3">
      {preview ? (
        <div className="relative h-full w-full">{art}</div>
      ) : (
        <button
          type="button"
          aria-label="编辑像素花盆"
          className="h-full w-full cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onEdit}
        >
          {art}
        </button>
      )}
    </div>
  )
}
