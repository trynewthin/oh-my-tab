import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const hours = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0")
)
const minutes = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0")
)

export default function TimePicker({
  id,
  value,
  onChange,
  hourLabel,
  minuteLabel,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  hourLabel: string
  minuteLabel: string
}) {
  const [hour, minute] = value.split(":")
  return (
    <div className="grid min-w-0 grid-cols-[1fr_auto_1fr] items-center gap-1.5 tabular-nums">
      <Select
        value={hour}
        onValueChange={(next) => {
          if (next !== null) onChange(`${next}:${minute}`)
        }}
      >
        <SelectTrigger id={id} className="w-full" aria-label={hourLabel}>
          <SelectValue>{hour}</SelectValue>
        </SelectTrigger>
        <SelectContent
          className="max-h-60 min-w-20"
          alignItemWithTrigger={false}
        >
          {hours.map((entry) => (
            <SelectItem key={entry} value={entry}>
              {entry}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span aria-hidden="true" className="text-muted-foreground">
        :
      </span>
      <Select
        value={minute}
        onValueChange={(next) => {
          if (next !== null) onChange(`${hour}:${next}`)
        }}
      >
        <SelectTrigger className="w-full" aria-label={minuteLabel}>
          <SelectValue>{minute}</SelectValue>
        </SelectTrigger>
        <SelectContent
          className="max-h-60 min-w-20"
          alignItemWithTrigger={false}
        >
          {minutes.map((entry) => (
            <SelectItem key={entry} value={entry}>
              {entry}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
