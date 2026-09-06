import type { CSSProperties } from "react"
import type { GardenPlant } from "./types"
import { growth, plantSeed, randomGene, plantName } from "@/lib/garden"

const FAMILIES = ["雏菊", "向日葵", "风铃草", "穗花", "蕨叶", "多肉"]
function Flower({
  x,
  y,
  kind,
  color,
  delay,
}: {
  x: number
  y: number
  kind: number
  color: string
  delay: number
}) {
  return (
    <g
      className="garden-blossom"
      style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${delay}s` }}
    >
      {kind === 2 ? (
        <>
          <path
            d={`M${x - 2} ${y - 3}h4v2h1v4h2v2h-3v-1h-4v1h-3v-2h2v-4h1Z`}
            fill={color}
          />
          <path
            d={`M${x - 1} ${y - 2}h1v5h-2v-3h1Z`}
            fill="#ffffff"
            opacity=".35"
          />
          <rect x={x - 1} y={y + 4} width="2" height="2" fill="#efd49d" />
        </>
      ) : kind === 3 ? (
        <>
          {Array.from({ length: 5 }, (_, i) => (
            <g key={i}>
              <rect
                x={x - (i % 2 ? 3 : 1)}
                y={y - i * 2}
                width="3"
                height="3"
                fill={color}
              />
              <rect
                x={x + (i % 2 ? 0 : 2)}
                y={y - i * 2 + 1}
                width="2"
                height="2"
                fill={color}
                opacity=".65"
              />
            </g>
          ))}
        </>
      ) : (
        <>
          {Array.from({ length: kind === 1 ? 10 : 8 }, (_, i) => {
            const angle = (i * Math.PI * 2) / (kind === 1 ? 10 : 8)
            const px = Math.round(x + Math.cos(angle) * (kind === 1 ? 5 : 4))
            const py = Math.round(y + Math.sin(angle) * (kind === 1 ? 5 : 4))
            return (
              <g key={i}>
                <rect
                  x={px - 1}
                  y={py - 1}
                  width="3"
                  height="3"
                  fill={kind === 1 ? "#efbc55" : color}
                />
                <rect
                  x={px - 1}
                  y={py - 1}
                  width="1"
                  height="1"
                  fill="#fff3c9"
                  opacity=".6"
                />
              </g>
            )
          })}
          <path
            d={`M${x - 2} ${y - 3}h4v1h1v4h-1v1h-4v-1h-1v-4h1Z`}
            fill={kind === 1 ? "#785040" : "#efc66f"}
          />
          <rect x={x - 1} y={y - 1} width="2" height="2" fill="#fff2bd" />
          {kind === 1 && (
            <path
              d={`M${x - 2} ${y - 1}h1v1h-1ZM${x + 1} ${y + 1}h1v1h-1Z`}
              fill="#bf8752"
            />
          )}
        </>
      )}
    </g>
  )
}

export default function GardenPlantArt({
  plant,
  now,
}: {
  plant: GardenPlant
  now: number
}) {
  const seed = plantSeed(plant)
  const gene = (index: number) => randomGene(seed, index)
  const { progress, level } = growth(plant, now)
  const kind = Math.floor(gene(50) * FAMILIES.length)
  const varied = plant.appearanceVersion === 2
  const height = Math.round(
    4 + progress * (varied ? 12 + gene(1) * 13 : 17 + gene(1) * 5)
  )
  const lean = Math.round(gene(2) * (varied ? 10 : 4) - (varied ? 5 : 2))
  const green = [
    "#51835f",
    "#6a9858",
    "#4e9182",
    "#7d9162",
    "#699e96",
    "#82985f",
  ][Math.floor(gene(3) * 6)]
  const light = ["#a4c47f", "#a1cdb0", "#b1c989"][Math.floor(gene(13) * 3)]
  const petal = [
    "#eaa0b4",
    "#ecbd69",
    "#b69bd2",
    "#e9876c",
    "#a9cfd3",
    "#e8d8ca",
    "#bb81b1",
    "#9aaae0",
  ][Math.floor(gene(4) * 8)]
  const branches = varied
    ? 2 + Math.floor(gene(5) * 5)
    : 3 + Math.floor(gene(5) * 3)
  const top = 35 - height
  return (
    <g
      className="ecosystem-plant"
      data-stage={level}
      data-family={FAMILIES[kind]}
      style={
        {
          "--plant-period": `${3.5 + gene(6) * 3}s`,
          "--plant-delay": `${-gene(7) * 8}s`,
          "--plant-sway": `${2 + gene(12) * 2}deg`,
        } as CSSProperties
      }
    >
      <title>{`${plantName(plant)} · ${FAMILIES[kind]} · ${["萌芽", "幼苗", "生长", "花期", "成熟"][level]}`}</title>
      <g key={level} className="garden-growth">
        {kind === 5 && level >= 1 ? (
          <>
            {Array.from({ length: 8 + level * 2 }, (_, i) => {
              const angle = i * 2.39996
              const radius =
                (4 + i * (varied ? 0.2 + gene(51) * 0.45 : 0.32)) *
                (0.5 + progress * 0.5)
              const x = Math.round(32 + Math.cos(angle) * radius)
              const y = Math.round(30 + Math.sin(angle) * radius * 0.6)
              return (
                <g
                  key={i}
                  className="garden-leaf"
                  style={{
                    transformOrigin: "32px 35px",
                    animationDelay: `${-gene(i + 20) * 7}s`,
                  }}
                >
                  <path
                    d={`M${x - 2} ${y - 4}h4v2h1v4h-1v1h-4v-1h-1v-4h1Z`}
                    fill={i % 2 ? green : light}
                  />
                  <rect
                    x={x - 1}
                    y={y - 3}
                    width="1"
                    height="4"
                    fill="#d7e8b8"
                    opacity=".45"
                  />
                </g>
              )
            })}
            {level >= 3 && (
              <Flower
                x={32}
                y={21}
                kind={0}
                color={petal}
                delay={-gene(44) * 4}
              />
            )}
          </>
        ) : (
          <>
            {Array.from({ length: height }, (_, i) => (
              <g key={i}>
                <rect
                  x={31 + Math.round((lean * i) / height)}
                  y={35 - i}
                  width="2"
                  height="1"
                  fill={green}
                />
                <rect
                  x={31 + Math.round((lean * i) / height)}
                  y={35 - i}
                  width=".7"
                  height="1"
                  fill={light}
                />
              </g>
            ))}
            {Array.from(
              {
                length: Math.min(branches, varied ? 1 + level * 2 : level + 2),
              },
              (_, i) => {
                const y = 34 - Math.round(((i + 1) * height) / (branches + 1))
                const x = 32 + Math.round((lean * (35 - y)) / height)
                const direction = i % 2 ? 1 : -1
                const length =
                  (varied ? 3 : 4) + Math.floor(gene(i + 10) * (varied ? 8 : 5))
                return (
                  <g
                    key={i}
                    className="garden-leaf"
                    style={{
                      transformOrigin: `${x}px ${y}px`,
                      animationDelay: `${-gene(i + 20) * 7}s`,
                    }}
                  >
                    {kind === 4 ? (
                      <>
                        <path
                          d={`M${x} ${y}l${direction * length} -${length}h${direction}l${-direction * length} ${length}Z`}
                          fill={green}
                        />
                        {Array.from({ length }, (_, j) => (
                          <g key={j} fill={j % 2 ? light : green}>
                            <rect
                              x={x + direction * j - 2}
                              y={y - j - 2}
                              width="4"
                              height="1"
                            />
                            <rect
                              x={x + direction * j}
                              y={y - j}
                              width="3"
                              height="1"
                            />
                          </g>
                        ))}
                      </>
                    ) : (
                      <>
                        <path
                          d={`M${x} ${y}h${direction * length}v-2h${-direction}v-2h${-direction * 3}v1h${-direction * (length - 4)}Z`}
                          fill={green}
                        />
                        <path
                          d={`M${x} ${y - 1}h${direction * (length - 1)}v-1h${-direction * (length - 1)}Z`}
                          fill={light}
                        />
                        {level >= 2 &&
                          (kind === 2 ||
                            kind === 3 ||
                            (kind === 0 && i % 2 === 0)) && (
                            <>
                              <path
                                d={`M${x} ${y}h${direction * length}v-${3 + (i % 3)}h1v${4 + (i % 3)}h${-direction * length}Z`}
                                fill={green}
                              />
                              {level >= 3 ? (
                                <Flower
                                  x={x + direction * length}
                                  y={y - 4 - (i % 3)}
                                  kind={kind}
                                  color={petal}
                                  delay={-gene(30 + i) * 5}
                                />
                              ) : (
                                <rect
                                  x={x + direction * length - 1}
                                  y={y - 5 - (i % 3)}
                                  width="3"
                                  height="3"
                                  fill={light}
                                />
                              )}
                            </>
                          )}
                      </>
                    )}
                  </g>
                )
              }
            )}
            {level >= 3 && kind !== 4 ? (
              <Flower
                x={32 + lean}
                y={top - 1}
                kind={kind}
                color={petal}
                delay={-gene(40) * 5}
              />
            ) : (
              <rect
                x={31 + lean}
                y={top - 1}
                width="3"
                height="2"
                fill={light}
              />
            )}
          </>
        )}
      </g>
    </g>
  )
}
