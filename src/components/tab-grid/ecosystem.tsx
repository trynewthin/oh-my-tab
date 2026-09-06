import GardenPlantArt from "./garden-plant-art"
import { useEffect, useState, type CSSProperties } from "react"
import type { EcosystemItem } from "./types"
import "./ecosystem.css"

export default function Ecosystem({
  item,
  preview = false,
  onEdit,
}: {
  item: EcosystemItem
  preview?: boolean
  onEdit?: () => void
}) {
  const [now, setNow] = useState(() => Date.now())
  const [wind, setWind] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])
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
        <g
          style={
            {
              transformOrigin: "32px 36px",
              transform: `rotate(${wind * 3}deg)`,
            } as CSSProperties
          }
        >
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
    <div
      className="relative h-full w-full p-3"
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect()
        setWind(((event.clientX - bounds.left) / bounds.width) * 2 - 1)
      }}
      onPointerLeave={() => setWind(0)}
    >
      {preview ? (
        art
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
