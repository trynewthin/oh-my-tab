export function weekdayOrder(
  locale: string,
  weekday: "short" | "narrow" = "short"
) {
  const format = new Intl.DateTimeFormat(locale, {
    weekday,
    timeZone: "UTC",
  })
  const reference = new Date(Date.UTC(2024, 0, 1)) // Monday
  return Array.from({ length: 7 }, (_, index) =>
    format.format(new Date(reference.getTime() + index * 86400000))
  )
}
