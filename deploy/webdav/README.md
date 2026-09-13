# 自部署 WebDAV

[返回文档中心](../../docs/README.md)

本方案使用 Apache WebDAV 保存 ZIP，Caddy 提供 HTTPS。需要一台安装 Docker Compose 的服务器、指向该服务器的域名，以及可用的 80/443 端口。默认只公开 HTTPS 入口，Apache 仅在容器网络内访问。

1. 在此目录复制 `.env.example` 为 `.env`，将 `DAV_DOMAIN` 改为自己的域名；如需网页开发端访问，将 `DEV_ORIGIN` 改为实际开发页面的来源（协议、主机和端口）。
2. 使用以下命令交互创建用户文件。密码通过终端提示输入，不写在命令参数中。

   ```sh
   mkdir -p auth
   docker run --rm -it -v "$PWD/auth:/auth" --entrypoint htpasswd httpd:2.4 -cB /auth/users your-user
   chmod 644 auth/users
   ```

3. 执行 `docker compose up -d`。Caddy 自动为域名申请 HTTPS 证书。
4. 在 Oh My Tab 的「常规」中将「多端同步」选为「WebDAV」，点击「WebDAV → 管理」，填写 `https://你的域名/`、用户名和密码，点击「连接」。首次上传生成 `oh-my-tab.zip`，其他设备填写相同地址后下载并确认恢复。
5. 备份 Docker 命名卷 `webdav-data`。停止服务时使用 `docker compose down`；带 `-v` 会删除包含备份的命名卷。

每个目录保存一份当前备份，上传会替换原有文件；需要历史版本时应对服务器数据卷另做快照。ZIP 包未加密，包含个人链接和原图；HTTPS 保护传输，服务器管理员可以读取文件。连接密码仅保留在页面内存中，关闭设置面板后需重新填写。

客户端要求服务器支持 `PROPFIND`、`GET`、`PUT`、强 `ETag` 和条件写入（`If-Match` / `If-None-Match`）。已存在文件没有强 ETag 时，客户端拒绝覆盖。第三方服务若忽略条件请求，不能保证并发覆盖保护；应使用符合这些要求的 WebDAV 服务。

扩展只按需申请所选服务器的访问权限。开发网页版通过 CORS 访问，服务器需要允许上面列出的请求方法和请求头，并暴露 `ETag`。此配置只允许 `DEV_ORIGIN` 指定的网页来源，不提供公共代理。地址必须直接响应，客户端不跟随重定向。

参考：[Apache mod_dav_fs](https://httpd.apache.org/docs/2.4/mod/mod_dav_fs.html)、[Caddy reverse_proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)、[Caddy header](https://caddyserver.com/docs/caddyfile/directives/header)。
