import type { RemoteWidgetItem } from "@/lib/grid/utility-types"
import {
  readRemoteWidget,
  widgetRequestUrl,
  WidgetNetworkError,
} from "@/lib/widgets/network"
import { requestWidgetOrigin } from "@/stores/privacy-store"

/** Invoke directly from a click so the permission request keeps user activation. */
export async function loadRemoteWidget(
  item: RemoteWidgetItem,
  signal: AbortSignal
) {
  const origin = new URL(widgetRequestUrl(item)).origin
  const granted = await requestWidgetOrigin(origin)
  if (!granted) throw new WidgetNetworkError("permissionDenied")
  signal.throwIfAborted()
  return readRemoteWidget(item, signal)
}
