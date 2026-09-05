import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { isPresetEngine, type SearchEngine } from "@/lib/search-engines"

type DeleteSearchEngineDialogProps = {
  engine: SearchEngine
  onCancel: () => void
  onConfirm: () => void
}

export default function DeleteSearchEngineDialog({
  engine,
  onCancel,
  onConfirm,
}: DeleteSearchEngineDialogProps) {
  const preset = isPresetEngine(engine.id)
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {preset ? "移除搜索引擎？" : "删除搜索引擎？"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {preset
              ? `将“${engine.name}”从列表中移除，可从预设中重新添加。`
              : `确定删除“${engine.name}”及其自定义配置？`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            {preset ? "确认移除" : "确认删除"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
