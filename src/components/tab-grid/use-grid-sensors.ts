import {
  KeyboardSensor,
  MouseSensor,
  useSensor,
  useSensors,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core"

// Arrow keys nudge the keyboard drag cursor by exactly one grid step; any
// other key falls through so dnd-kit keeps its default behavior.
export default function useGridSensors({
  columnStep,
  rowStep,
}: {
  columnStep: number
  rowStep: number
}) {
  const keyboardCoordinates: KeyboardCoordinateGetter = (
    event,
    { currentCoordinates }
  ) => {
    const delta = {
      ArrowLeft: [-columnStep, 0],
      ArrowRight: [columnStep, 0],
      ArrowUp: [0, -rowStep],
      ArrowDown: [0, rowStep],
    }[event.code]
    if (!delta) return undefined
    event.preventDefault()
    return {
      x: currentCoordinates.x + delta[0],
      y: currentCoordinates.y + delta[1],
    }
  }
  return useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: keyboardCoordinates })
  )
}
