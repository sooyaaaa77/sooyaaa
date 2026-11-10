# 部署手册：把网站发布到公网云服务器

> 目标：用**最原始、最透明**的方式（apt 装 Nginx + 手动上传文件）把静态网站部署到阿里云服务器，
> 用公网 IP 访问。全程不使用宝塔面板、LNMP 一键包、云厂商「一键建站」镜像等工具。
>
> 阅读前提：已完成 `docs/01-requirements.md`、`docs/02-design.md`、`docs/03-plan.md`；
> 本地能运行 `python -m http.server` 预览网站。

---

## 一、部署架构

```text
本地电脑                                    阿里云服务器（Ubuntu 22.04）
┌─────────────────────┐                    ┌──────────────────────────────────┐
│  Git 仓库            │   tar + scp        │  /var/www/mysite/                │
│  index.html 等静态文件│ ────────────────▶  │   ├── index.html                 │
│  scripts/deploy.sh   │                    │   ├── style.css / main.js        │
└─────────────────────┘                    │   └── ...                        │
                                            │        ▲                         │
                                            │        │ 读取静态文件             │
                                            │   Nginx（监听 80 端口）           │
                                            └────────┬─────────────────────────┘
                                                     │
                                          公网 IP: http://<服务器IP>/
```

要点：

- **纯静态**，服务器不需要 Node、Java、数据库，也不需要反向代理，只装一个 Nginx。
- 部署动作 = 「打包 → 上传 → 解压覆盖 → reload Nginx」，没有构建步骤。
- 两周内**不做域名和 HTTPS**：国内服务器绑定域名需要 ICP 备案（个人备案通常 1–2 周），
  会直接吃掉课程时间。用 IP 访问完全满足「公网可访问」的要求，域名与证书列为可选扩展（第十一节）。

---

## 二、准备工作

### 2.1 购买服务器（阿里云学生认证 300 元券）

1. 登录阿里云官网，搜索「高校计划」或「学生认证」，完成学生身份认证并领取 300 元优惠券。
2. 进入「云服务器 ECS」或「轻量应用服务器」购买页：
   - 地域：选择离学校/常住地近的（如华东 1 杭州、华北 2 北京）。
   - 镜像：**系统镜像 → Ubuntu 22.04 LTS 64 位**。
     ⚠️ 不要选「应用镜像」「一键建站」「WordPress」类镜像，这是课程明确禁止的。
   - 规格：2 核 2G 足够（静态站 1 核 1G 也能跑），带宽 1–3 Mbps 即可。
   - 时长：先买 1 个月，够用两周；300 元券通常能覆盖。
3. 购买完成后，在控制台记录三项信息（写进自己的备忘录，**不要提交密码到 Git**）：
   - 公网 IP
   - 登录用户名（ECS 一般是 root；轻量应用服务器可能先要设置密码）
   - 实例所在地域

### 2.2 本地准备

- Windows 建议用 Git Bash（安装 Git 时自带），自带 `ssh`、`scp`、`tar`。
- 确认本地能 SSH 登录服务器：

```bash
ssh root@<服务器公网IP>
# 首次登录输入 yes 和密码
```

> 安全提示：密码只输入在终端里，不要写进文档、截图或 Git 提交。

---

## 三、初始化服务器

以下命令都在服务器上执行（SSH 登录后）。

### 3.1 系统更新

```bash
apt update
apt upgrade -y
```

### 3.2 创建普通部署用户（推荐，避免全程用 root）

```bash
adduser deploy            # 按提示设置密码
usermod -aG sudo deploy   # 加入 sudo 组
```

之后可用 `ssh deploy@<IP>` 登录，执行管理命令时加 `sudo`。

> 如果为了两周内省事直接用 root，也完全可行；但至少给 root 设置一个强密码：
> `passwd root`。

### 3.3 防火墙与安全组

阿里云有**两层**网络控制，两层都要放行 80 端口：

1. **安全组**（云控制台 → 实例 → 安全组 → 入方向规则）：

   | 端口 | 协议 | 授权对象 | 用途 |
   | --- | --- | --- | --- |
   | 22 | TCP | 0.0.0.0/0（或你的校园网 IP 段） | SSH 管理 |
   | 80 | TCP | 0.0.0.0/0 | HTTP 访问网站 |
   | 443 | TCP | 0.0.0.0/0 | 预留（将来 HTTPS 用） |

   轻量应用服务器在「防火墙」页面添加同样的规则。

2. **服务器系统防火墙**（Ubuntu 默认 ufw）：

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

### 3.4 安装 Nginx

```bash
apt install -y nginx
systemctl status nginx --no-pager
curl -I http://localhost
```

看到 `HTTP/1.1 200 OK` 和 Nginx 欢迎页就说明装好了。

先认识三个关键路径：

| 路径 | 作用 |
| --- | --- |
| `/etc/nginx/nginx.conf` | 全局配置（保持默认即可） |
| `/etc/nginx/sites-available/` | 可用站点配置 |
| `/etc/nginx/sites-enabled/` | 已启用站点（软链接） |
| `/var/www/` | 站点文件根目录 |

---

## 四、上传网站文件

站点目录统一用 `/var/www/mysite`。

### 方式 A：使用项目自带的部署脚本（推荐）

`scripts/deploy.sh` 做三件事：本地打包 → scp 上传 → 远程解压并 reload Nginx。

前置条件：

- 本地能免密 SSH 登录服务器（或用 root 登录）；
- 服务器端执行 `sudo` 时不需要交互输密码，否则脚本会卡住。

配置 sudo 免密（服务器上执行一次，把 `deploy` 换成你的用户名）：

```bash
echo "deploy ALL=(ALL) NOPASSWD: ALL" | sudo tee /etc/sudoers.d/deploy
sudo chmod 440 /etc/sudoers.d/deploy
```

本地执行：

```bash
# 在仓库根目录
./scripts/deploy.sh root@<服务器IP>
# 或者用环境变量
DEPLOY_TARGET=root@<服务器IP> ./scripts/deploy.sh
```

脚本成功后会输出 `部署完成，访问：http://<IP>/`。

> 注意：脚本只上传 `SITE_FILES` 数组里列出的文件。以后新增页面（如 `projects.html`），
> 记得同步修改 `scripts/deploy.sh` 的数组，否则线上会 404。

### 方式 B：手动上传（理解原理用）

```bash
# 本地打包
tar -czf site.tar.gz index.html 404.html style.css main.js favicon.svg resume.pdf

# 上传
scp site.tar.gz root@<服务器IP>:/tmp/

# 服务器上解压
sudo mkdir -p /var/www/mysite
sudo tar -xzf /tmp/site.tar.gz -C /var/www/mysite
sudo chown -R www-data:www-data /var/www/mysite
sudo chmod -R 755 /var/www/mysite
rm -f /tmp/site.tar.gz
```

---

## 五、配置 Nginx 站点

仓库里的 `deploy/nginx.conf` 就是站点配置模板。

### 5.1 上传并启用配置

```bash
# 在本地仓库根目录执行（注意替换 IP）
scp deploy/nginx.conf root@<服务器IP>:/tmp/mysite.conf
```

服务器上：

```bash
sudo mv /tmp/mysite.conf /etc/nginx/sites-available/mysite

# 把 server_name 改成服务器公网 IP（没有域名就写 IP）
sudo sed -i 's/your-server-ip-or-domain/<服务器IP>/' /etc/nginx/sites-available/mysite

# 启用站点，禁用默认站点（可选，避免 server_name 冲突）
sudo ln -sf /etc/nginx/sites-available/mysite /etc/nginx/sites-enabled/mysite
sudo rm -f /etc/nginx/sites-enabled/default

# 检查语法并重载
sudo nginx -t
sudo systemctl reload nginx
```

### 5.2 配置内容说明

| 配置项 | 作用 | 为什么这么写 |
| --- | --- | --- |
| `root /var/www/mysite` | 站点根目录 | 与部署脚本解压路径一致 |
| `index index.html` | 默认首页 | 纯静态站唯一入口 |
| `try_files $uri $uri/ =404` | 找不到文件返回 404 | 不做目录列表，不暴露结构 |
| `error_page 404 /404.html` | 自定义 404 | 保持站点风格一致 |
| `expires 7d` | 静态资源缓存 7 天 | 减少重复传输；更新后用 Ctrl+F5 强刷 |
| `gzip on` | 文本压缩 | CSS/JS 体积约减少 60–70% |
| `location ~ /\.` + `deny all` | 禁止访问 .git 等隐藏文件 | 上传时若误带 `.git` 也不会泄露 |
| 三个 `add_header` | 安全响应头 | 防止 MIME 嗅探、点击劫持、Referer 泄露 |

---

## 六、公网验证

### 6.1 浏览器

- 电脑浏览器访问 `http://<服务器IP>/`，应看到完整首页。
- 手机**关闭 Wi-Fi、用流量**访问同一地址，验证公网可达（避免校园网缓存/代理干扰）。
- 若开了 VPN/代理，先关闭再测。

### 6.2 命令行检查

```bash
# 首页状态码与类型
curl -I http://<服务器IP>/
# 期望：HTTP/1.1 200 OK，Content-Type: text/html

# CSS 缓存头
curl -I http://<服务器IP>/style.css
# 期望：200，Cache-Control: max-age=604800

# gzip 是否生效
curl -I -H "Accept-Encoding: gzip" http://<服务器IP>/style.css
# 期望：Content-Encoding: gzip

# 404 页面
curl -I http://<服务器IP>/not-exist
# 期望：HTTP/1.1 404 Not Found
```

### 6.3 验收标准

| 检查项 | 通过标准 |
| --- | --- |
| 公网访问 | 手机流量下能打开首页 |
| 资源加载 | 浏览器 Network 面板无 404，CSS/JS 正常加载 |
| 404 | 访问不存在的地址显示自定义 404 页 |
| gzip | 响应头含 `Content-Encoding: gzip` |
| 安全头 | 响应头含 `X-Content-Type-Options: nosniff` |
| 备注 | 课程要求「公网可访问」已满足，无需域名 |

---

## 七、日常发布流程

```bash
# 1. 本地改内容 / 样式
# 2. 本地预览
python -m http.server 8000
# 3. 提交
git add -A
git commit -m "docs: 更新项目经历文案"
# 4. 部署
./scripts/deploy.sh root@<服务器IP>
# 5. 浏览器 Ctrl+F5 强刷验证（缓存 7 天，普通刷新可能看到旧文件）
```

> 建议每次上线前 `git tag` 打一个版本号（如 `v0.1.0`、`v1.0.0`），
> 回滚时按 tag 重新部署。

---

## 八、常见问题排查

| 现象 | 可能原因 | 排查与解决 |
| --- | --- | --- |
| 浏览器打不开、一直转圈 | 安全组未放行 80；ufw 未放行；Nginx 未启动 | 控制台查安全组；`sudo ufw status`；`systemctl status nginx` |
| 403 Forbidden | 目录权限不对；index 文件名错误 | `ls -l /var/www/mysite`；确保 `index.html` 存在且 www-data 可读 |
| 404 Not Found（首页也 404） | `root` 路径写错；文件没上传成功 | `sudo nginx -T \| grep root`；`ls /var/www/mysite` |
| 改了文件但页面没变 | 浏览器缓存 / `expires` 7 天 | `Ctrl+F5`；或 `curl -I` 看 `Last-Modified` |
| `nginx -t` 报错 | 配置少分号/括号；`server_name` 与别的站点冲突 | 按报错行号检查；禁用 `sites-enabled/default` |
| 中文乱码 | 服务器返回编码不对 | 配置 `charset utf-8;`，HTML 有 `<meta charset="UTF-8">` |
| SSH 连不上 | 22 端口未放行；校园网 IP 变了 | 安全组放行 22；用手机热点测试 |
| `deploy.sh` 卡住 | 远程 sudo 需要输密码 | 配置 NOPASSWD sudoers（见第四节） |

排查顺序固定为：**网络（安全组/ufw）→ 服务（nginx 状态）→ 配置（nginx -t）→ 文件（目录与权限）→ 缓存**。

---

## 九、回滚方案

1. **按 Git tag 回滚**（推荐）：

```bash
git checkout v0.1.0          # 切到上一个稳定版本
./scripts/deploy.sh root@<IP>
git checkout main            # 回到主线
```

2. **服务器本地备份**：部署前把旧目录改名保留。

```bash
sudo cp -a /var/www/mysite /var/www/mysite.bak.$(date +%Y%m%d-%H%M)
# 需要回滚时
sudo rm -rf /var/www/mysite && sudo mv /var/www/mysite.bak.<时间> /var/www/mysite
sudo systemctl reload nginx
```

3. **配置回滚**：保留 `deploy/nginx.conf` 在 Git 里，改坏了重新 `scp` 上传即可。

---

## 十、安全加固清单（课程作业最低要求）

- [x] 安全组只放行 22/80/443
- [x] ufw 已启用
- [x] 不用 root 直接跑网站（Nginx 以 www-data 运行）
- [x] 禁止访问 `.git`、`.env` 等隐藏文件
- [x] 密码、私钥不进 Git（`.gitignore` 已忽略 `*.pem`、`*.key`、`.env`、`deploy/local.conf`）
- [ ] 把 SSH 改为密钥登录并禁用密码登录（可选，加分项）：

```bash
# 本地生成密钥（如果还没有）
ssh-keygen -t ed25519 -C "portfolio-deploy"
# 上传公钥
ssh-copy-id root@<服务器IP>
# 服务器上确认可免密登录后，再改 /etc/ssh/sshd_config：
#   PasswordAuthentication no
sudo systemctl restart ssh
```

> 改 SSH 配置前一定先**另开一个终端**验证密钥能登录，避免把自己锁在门外。

---

## 十一、可选扩展：域名与 HTTPS（两周内不做）

课程作业只要求公网可访问，IP 访问已满足。若后续想继续完善：

1. **域名**：买域名 → 添加 A 记录指向服务器 IP。
2. **备案**：服务器在中国大陆，域名必须完成 ICP 备案才能解析访问（个人备案约 1–2 周）。
   不想备案可选择香港/境外节点，但访问速度较慢。
3. **HTTPS**：备案通过后，用 Let's Encrypt 免费证书：

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d example.com -d www.example.com
# 自动续期由 certbot.timer 负责：systemctl status certbot.timer
```

4. **自动部署（进阶）**：GitHub Actions 在 push tag 时通过 SSH 执行 `deploy.sh`，
   把「部署」也纳入版本管理流程。

---

## 十二、部署检查清单（打印/复制使用）

- [ ] 服务器已购买，镜像为 Ubuntu 22.04 系统镜像（非一键建站镜像）
- [ ] 安全组放行 22 / 80
- [ ] `apt update && apt upgrade` 完成
- [ ] Nginx 安装完成，`curl -I localhost` 返回 200
- [ ] `/var/www/mysite` 已创建，文件权限为 www-data:www-data / 755
- [ ] 站点配置已启用，`nginx -t` 通过
- [ ] 公网 IP 能打开首页
- [ ] 手机流量能打开首页
- [ ] `/not-exist` 返回自定义 404
- [ ] CSS/JS 无 404，gzip 生效
- [ ] 部署脚本可重复执行（第二次部署不报错）
- [ ] 回滚流程演练过一次

---

## 附录：服务器常用命令速查

```bash
# 服务
sudo systemctl status nginx        # 查看状态
sudo systemctl reload nginx        # 重载配置（不中断连接）
sudo systemctl restart nginx       # 重启
sudo nginx -t                      # 只检查配置语法

# 日志
sudo tail -f /var/log/nginx/mysite.access.log
sudo tail -f /var/log/nginx/mysite.error.log

# 文件
ls -l /var/www/mysite
sudo chown -R www-data:www-data /var/www/mysite

# 网络
curl -I http://localhost
ss -tlnp | grep :80                # 谁在监听 80
sudo ufw status verbose
```
