import WorkdayTile from "./utility/workday-widget"
import { remoteSourceKey } from "@/lib/widgets/network"
import { NoteTile, PhotoTile } from "./utility/content-widgets"
import RemoteTile from "./utility/remote-widget"
import {
  ClockTile,
  CountdownTile,
  PomodoroTile,
  WorldClockTile,
} from "./utility/time-widgets"
import type { WidgetProps } from "./utility/surface"

export default function UtilityWidgetTile(props: WidgetProps) {
  const { item } = props
  switch (item.kind) {
    case "workday":
      return <WorkdayTile {...props} item={item} />
    case "clock":
      return <ClockTile {...props} item={item} />
    case "countdown":
      return <CountdownTile {...props} item={item} />
    case "note":
      return <NoteTile {...props} item={item} />
    case "pomodoro":
      return <PomodoroTile {...props} item={item} />
    case "photo":
      return <PhotoTile {...props} item={item} />
    case "world-clock":
      return <WorldClockTile {...props} item={item} />
    case "weather":
    case "rss":
      return (
        <RemoteTile
          key={`${item.id}:${remoteSourceKey(item)}`}
          {...props}
          item={item}
        />
      )
  }
}
