import { Info } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTrigger,
} from "@/components/ui/popover"
import { settingsControlClassName } from "../shared/control-styles"

export default function WebdavRow({
  disabled,
  onManage,
}: {
  disabled: boolean
  onManage: () => void
}) {
  return (
    <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
      <div className="flex items-center gap-1">
        <span className="text-sm">WebDAV</span>
        <Popover>
          <PopoverTrigger
            openOnHover
            delay={150}
            closeDelay={100}
            aria-label="WebDAV 说明与配置"
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                className="rounded-full text-muted-foreground"
              />
            }
          >
            <Info className="size-4" aria-hidden="true" />
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-80 max-w-[calc(100vw-2rem)] gap-3 rounded-xl p-3"
            aria-label="WebDAV 说明与配置"
          >
            <PopoverDescription className="text-xs leading-5">
              WebDAV
              是一种远程文件存储协议，可将备份保存到你指定的服务器，供多台设备手动同步。
            </PopoverDescription>
            <ol className="list-decimal space-y-2 pl-4 text-xs leading-5 text-muted-foreground">
              <li>
                准备支持 WebDAV 的服务，创建备份目录，获取 HTTPS
                目录地址、用户名和密码。
              </li>
              <li>点击「管理」，填写上述信息，再点击「连接」。</li>
              <li>
                连接成功后点击「上传」保存本机备份；其他设备填写同一目录，连接后点击「下载」并确认恢复。
              </li>
            </ol>
          </PopoverContent>
        </Popover>
      </div>
      <Button
        variant="outline"
        className={settingsControlClassName}
        disabled={disabled}
        onClick={onManage}
      >
        管理
      </Button>
    </div>
  )
}
