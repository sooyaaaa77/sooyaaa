# 07 · 测试报告

> 状态：v0.1 初稿 ｜ 最后更新：2026-11-10
> 关联：`docs/01-requirements.md`（验收标准）、`docs/03-plan.md`（排期）、`docs/04`（部署手册）
> 原则：**只写真实结果**。已执行的检查附命令与结论；未执行的项明确标注，不预填分数、不伪造截图。
> 状态图例：✅ 通过｜✅ 走查（静态检查/代码走查确认，未浏览器实测）｜⏳ 待执行｜⚠️ 已知限制

## 1. 测试目标与范围

课程作业的验收不只看页面好不好看，还看流程是否完整。测试围绕四个维度：

| 维度 | 课程要求 | 本报告的验证方式 |
|---|---|---|
| 内容完整 | 六个区块齐全，信息可读，链接可用 | 代码走查 + 人工浏览 |
| 多端可用 | 360px 手机到 1920px 桌面布局正常 | 断点走查 + 真机待测 |
| 可访问性 | 键盘可操作、语义化、对比度、降低动效 | 代码走查 + 对比度计算 |
| 部署可访问 | 公网 IP 能打开，404、缓存、压缩正确 | 待服务器就绪后执行 |

**在范围内**：`index.html`、`404.html`、`style.css`、`main.js`、Nginx 配置与部署脚本的静态检查。
**不在本期**：后端接口、数据库、登录、IE 及旧版浏览器、打印样式、域名/HTTPS/CDN、屏幕阅读器全量测试。

## 2. 测试环境

| 项目 | 实际情况 | 说明 |
|---|---|---|
| 操作系统 | Windows 11 | 开发与静态检查环境 |
| 终端 | Git Bash（MSYS2） | 执行 `node`、`python`、`bash` 命令 |
| Node.js | v22.14.0 | `node --check` 语法检查 |
| Python | 3.12.10 | HTML 解析与文本检查脚本 |
| 浏览器 | Chrome / Edge 现代版本 | 版本号未记录；未安装 Firefox |
| 服务器 | 阿里云 ECS · Ubuntu 22.04 | **尚未购买**，部署验证待执行 |
| 手机真机 | Android / iOS | 尚未测试；仅用开发者工具模拟 |
| 网络 | 家庭宽带；手机 4G | 4G 访问待服务器就绪后测试 |

> 注意：项目保持零第三方依赖，因此**没有引入** Playwright、Selenium 等浏览器自动化工具。功能用例目前以代码走查为主，最终结论必须经过人工浏览器走查后才能签字验收。

## 3. 静态检查（已执行）

| 编号 | 检查项 | 命令 | 实际结果 | 结论 |
|---|---|---|---|---|
| SC-01 | JS 语法 | `node --check main.js` | 无输出（退出码 0） | ✅ 通过 |
| SC-02 | HTML 标签闭合 | Python `html.parser` 栈匹配 | 两文件均 0 错误、0 未闭合 | ✅ 通过 |
| SC-03 | Shell 脚本语法 | `bash -n scripts/deploy.sh` | 无输出（退出码 0） | ✅ 通过 |
| SC-04 | CSS 括号配平 | 统计 `{` 与 `}` | 211 / 211 | ✅ 通过 |

```bash
node --version            # v22.14.0
node --check main.js      # 无输出即通过
bash -n scripts/deploy.sh # 无输出即通过
python -c "s=open('style.css',encoding='utf-8').read(); print(s.count('{'), s.count('}'))"  # 211 211
```

HTML 闭合检查（按栈匹配，忽略 `br`、`img` 等空元素）：

```bash
python - <<'PY'
from html.parser import HTMLParser
VOID={"area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"}
class C(HTMLParser):
    def __init__(s): super().__init__(); s.st=[]; s.er=[]
    def handle_starttag(s,t,a):
        if t not in VOID: s.st.append(t)
    def handle_endtag(s,t):
        s.st.pop() if s.st and s.st[-1]==t else s.er.append(t)
for f in ("index.html","404.html"):
    p=C(); p.feed(open(f,encoding="utf-8").read()); print(f,"errors:",len(p.er),"unclosed:",p.st)
PY
# index.html errors: 0 unclosed: [] ／ 404.html errors: 0 unclosed: []
```

> 注意：静态检查只能证明「文件能被解析」，不能证明「页面上看到的是对的」。布局、动效、交互和真机表现必须做第 4–6 节的人工验证。

## 4. 功能测试用例

默认前置条件：本地 `python -m http.server 8080` 启动，浏览器打开 <http://localhost:8080>，控制台无报错。状态中「待浏览器」表示需在验收前补做。

| 编号 | 用例 | 前置条件与步骤 | 预期结果 | 状态 |
|---|---|---|---|---|
| TC-01 | 首屏内容渲染 | 打开首页，观察首屏 | 姓名、定位句、学校/届别、两个按钮、滚动提示、贴纸齐全，无裂图 | ✅ 走查 / ⏳ 待浏览器 |
| TC-02 | 主题切换与持久化 | 点主题按钮；刷新；打开 `404.html` | `data-theme` 切换；刷新后保持；`localStorage["portfolio-theme"]` 有值；404 页主题一致 | ✅ 走查 / ⏳ 待浏览器 |
| TC-03 | 跟随系统主题且无闪烁 | 清除站点数据，系统切深色，打开首页 | 首屏即深色，无「先白后黑」闪烁（head 内联脚本先于样式执行） | ✅ 走查 / ⏳ 待浏览器 |
| TC-04 | 移动菜单开合 | 视口 ≤620px，点菜单按钮；点任一菜单链接 | 全屏菜单出现、页面滚动锁定；点链接后菜单关闭并跳到锚点 | ✅ 走查 / ⏳ 待浏览器 |
| TC-05 | 菜单 Esc 关闭与 aria | 打开菜单，按 `Esc`，检查属性 | 菜单关闭；`aria-expanded="false"`、菜单 `aria-hidden="true"`、`body.menu-open` 移除 | ✅ 走查 / ⏳ 待浏览器 |
| TC-06 | 导航锚点与偏移 | 点击「关于」「项目」等导航项 | 平滑滚动到区块，标题不被固定导航遮挡（`scroll-margin-top: 84px`） | ✅ 走查 / ⏳ 待浏览器 |
| TC-07 | 当前区块高亮 | 缓慢滚动经过六个区块 | 对应导航项加 `.is-active` 与 `aria-current="true"`，同时只有一个激活项 | ✅ 走查 / ⏳ 待浏览器 |
| TC-08 | 滚动进度条 | 从顶部滚到底部，再滚回顶部 | 顶部 1px 进度条宽度 0% → 100%，无抖动 | ✅ 走查 / ⏳ 待浏览器 |
| TC-09 | 进场动画 | 刷新后逐段滚动 | `[data-reveal]` 进入视口后加 `.is-in` 播放一次，不重复 | ✅ 走查 / ⏳ 待浏览器 |
| TC-10 | 数字滚动 | 滚动到「关于我」数据区 | 四个数字从 0 增长到 3 / 1200 / 8 / 100，约 1.2s 结束 | ✅ 走查 / ⏳ 待浏览器 |
| TC-11 | 自定义光标 | 桌面精确指针移动鼠标；触屏打开 | 圆点即时跟随、圆环延迟跟随；悬停链接时圆环放大；触屏隐藏 | ✅ 走查 / ⏳ 待浏览器 |
| TC-12 | 滚动横幅 | 悬停到 marquee 上 | 文字循环滚动，悬停时暂停（CSS `animation-play-state`） | ✅ 走查 / ⏳ 待浏览器 |
| TC-13 | 降低动效偏好 | 系统开启「减少动态效果」后打开首页 | 进场、数字滚动、光标、marquee 关闭，内容直接完整显示 | ✅ 走查 / ⏳ 待浏览器 |
| TC-14 | 无 JS 降级 | 禁用 JavaScript 后打开首页 | 文字内容全部可见（`.js [data-reveal]` 才隐藏），锚点导航仍可用 | ⏳ 待浏览器 |
| TC-15 | 外链安全属性 | 检查所有 `target="_blank"` 链接 | 均带 `rel="noopener noreferrer"`；目前 2 处 GitHub 占位链接符合 | ✅ 走查 |
| TC-16 | 简历下载 | 点首屏「下载简历」与联系区「简历」 | 触发 `resume.pdf` 下载（当前为占位文件，见 DEF-02） | ✅ 走查 / ⏳ 待浏览器 |
| TC-17 | 回到顶部与年份 | 点页脚 ↑、品牌标；查看年份 | 回到 `#top`；年份由脚本写入当前年份 | ✅ 走查 / ⏳ 待浏览器 |
| TC-18 | 404 页面 | 本地 HTTP 服务访问不存在路径；服务器上再验证状态码 | 显示 404 页，有「回到首页」与邮箱入口；线上应返回 HTTP 404 而非 200 | ✅ 走查（`file://` 下 `/` 链接会失效） / ⏳ 待部署验证 |

## 5. 响应式与兼容性测试

**断点与视口矩阵**（每档确认：无横向滚动、无截断重叠、可点击、首屏高度合理）

| 视口 | 预期布局 | 状态 |
|---|---|---|
| 320px | 最小宽度，允许极少溢出，但不应有横向滚动条 | ⏳ 待测（设计下限 360px） |
| 360 / 375 / 414px | 单列布局，菜单按钮出现，作品卡单列 | ⏳ 待真机 |
| 619 / 621px | 620px 断点两侧布局平滑切换 | ⏳ 待浏览器 |
| 768px | 平板：作品与技能两列，联系区单列 | ⏳ 待浏览器 |
| 1080 / 920px | 1080 收缩导航间距；920 以下桌面导航隐藏、改菜单按钮 | ⏳ 待浏览器 |
| 1440 / 1920px | 内容最大宽度 1180px 居中，两侧留白正常 | ⏳ 待浏览器 |

**浏览器兼容性**

| 浏览器 / 设备 | 依据 | 状态 |
|---|---|---|
| Chrome / Edge 现代版本（桌面） | CSS 变量、Grid、`clamp()`、IntersectionObserver 均为标准特性 | ⏳ 待实测 |
| Firefox 现代版本 | 标准特性支持良好 | ⏳ 未安装，待测 |
| Safari / iOS Safari | 需注意 `100vh`、字体栈、`backdrop-filter` 差异 | ⏳ 无设备，待测 |
| Android Chrome | 主要目标移动端 | ⏳ 待真机 |

> 注意：代码未使用需要 polyfill 的 API；若实测发现 `100vh` 导致移动端首屏过高，可改用 `100svh` 或 JS 设置高度。

## 6. 可访问性检查

| 编号 | 检查项 | 实现依据 | 状态 |
|---|---|---|---|
| A11Y-01 | 跳过导航链接 | `.skip-link` → `#main`，聚焦时显示 | ✅ 走查 |
| A11Y-02 | 语义地标与标题 | `header / nav / main / section / footer`；全页单一 `h1`，区块用 `h2` | ✅ 走查 / ⏳ 待浏览器确认 |
| A11Y-03 | 键盘 Tab 顺序 | 链接、按钮、菜单均为原生可聚焦元素；未发现 `tabindex > 0` | ⏳ 待人工验证 |
| A11Y-04 | 焦点可见 | `:focus-visible` 有独立描边样式 | ✅ 走查 / ⏳ 待浏览器 |
| A11Y-05 | ARIA 状态同步 | 主题按钮 `aria-label` 随状态更新；菜单按钮 `aria-expanded`；菜单 `aria-hidden` | ✅ 走查 |
| A11Y-06 | 装饰元素隐藏 | 进度条、光标、滚动横幅、装饰图形均 `aria-hidden="true"` | ✅ 走查 |
| A11Y-07 | 颜色对比度 | 按 `style.css` 变量计算，见下表 | ⚠️ 部分达标 |
| A11Y-08 | 降低动效 | `prefers-reduced-motion` 同时作用于 CSS 与 JS | ✅ 走查 |
| A11Y-09 | 光标不影响操作 | 光标层 `pointer-events: none`，仅视觉跟随 | ✅ 走查 |
| A11Y-10 | 移动菜单焦点管理 | 打开后未移入焦点，也未做焦点陷阱 | ⚠️ 待改进（DEF-05） |
| A11Y-11 | 图片替代文本 | 当前无 `<img>`；替换真实照片时必须补 `alt` | ⏳ 内容替换时执行 |

对比度计算（按 CSS 变量值，WCAG AA 正文要求 ≥4.5:1）：

| 组合 | 对比度 | 判定 |
|---|---|---|
| 浅色 `--ink` / `--paper` | 15.42:1 | ✅ |
| 浅色 `--ink-2` / `--paper` | 8.48:1 | ✅ |
| 浅色 `--muted` / `--paper` | 3.39:1 | ⚠️ 仅适合大字号/非关键信息 |
| 浅色 `--accent` / `--paper` | 3.65:1 | ⚠️ 小字号强调文字需复核 |
| 深色 `--ink` / `--paper` | 15.35:1 | ✅ |
| 深色 `--muted` / `--paper` | 5.32:1 | ✅ |
| 深色 `--accent` / `--paper` | 6.55:1 | ✅ |

> `--muted` 用于小标签、页脚注释等辅助信息，但严格按 AA 仍不达标；是否加深颜色需在视觉验收时人工判断，已记入 DEF-03。

## 7. 部署与线上验证清单（待服务器就绪后执行）

以下项目**全部未执行**，服务器尚未购买。命令按 `docs/04` 编写，执行后回填状态。

| 编号 | 检查项 | 命令 / 操作 | 预期 | 状态 |
|---|---|---|---|---|
| DP-01 | Nginx 配置语法 | `sudo nginx -t` | `syntax is ok` / `test is successful` | ⏳ |
| DP-02 | 首页与 Content-Type | `curl -I http://<IP>/` | `200 OK`，`text/html` | ⏳ |
| DP-03 | gzip 压缩 | `curl -sI -H "Accept-Encoding: gzip" http://<IP>/style.css` | 含 `Content-Encoding: gzip` | ⏳ |
| DP-04 | 静态资源缓存 | `curl -sI http://<IP>/style.css` | 含 `Cache-Control` 与 `Expires`（7 天） | ⏳ |
| DP-05 | 404 状态与页面 | `curl -s -o /dev/null -w "%{http_code}" http://<IP>/no-such-page` | 返回 `404`，页面为自定义 `404.html` | ⏳ |
| DP-06 | 安全响应头 | `curl -sI http://<IP>/` | 含 `X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy` | ⏳ |
| DP-07 | 隐藏文件禁止访问 | `curl -sI http://<IP>/.git/config` | `403 Forbidden` | ⏳ |
| DP-08 | 手机 4G 访问 | 关 Wi-Fi，手机流量打开 `http://<IP>/` | 5 秒内加载完成，布局正常 | ⏳ |
| DP-09 | 日志无异常 | `tail -n 50 /var/log/nginx/mysite.error.log` | 无 5xx、无权限报错 | ⏳ |

```bash
sudo nginx -t && sudo systemctl reload nginx
curl -I http://<IP>/
curl -sI -H "Accept-Encoding: gzip" http://<IP>/style.css | grep -i content-encoding
curl -sI http://<IP>/style.css | grep -iE "cache-control|expires"
curl -s -o /dev/null -w "%{http_code}\n" http://<IP>/no-such-page
```

## 8. 性能检查清单（Lighthouse 待执行）

| 指标 | 目标 | 当前依据 | 状态 |
|---|---|---|---|
| 首屏关键资源体积 | ≤150 KB | HTML 22.5 + CSS 28.8 + JS 8.0 ≈ 58 KB（未压缩） | ✅ 依据文件大小 |
| 第三方请求 | 0 个 | 无外链字体、库、图片 | ✅ 走查 |
| 阻塞渲染资源 | 无 | CSS 单文件，JS 带 `defer` | ✅ 走查 |
| gzip 后传输体积 | — | 预计约 15–20 KB（估算，待 `curl` 实测） | ⏳ |
| Lighthouse 性能 / 可访问性 | ≥90 | 未执行，不预填分数 | ⏳ |
| LCP / CLS / TBT | 无严重告警 | 未执行 | ⏳ |

执行方式：`npx lighthouse http://localhost:8080 --preset=desktop --view`（桌面）与 `npx lighthouse http://localhost:8080 --view`（移动端）。

> Lighthouse 分数受本机负载、网络与扩展影响；报告需记录执行时间、Chrome 版本与两次结果取中位数，避免只截一次高分。

## 9. 缺陷记录表

| 编号 | 现象 | 严重级 | 状态 |
|---|---|---|---|
| DEF-01 | 全部区块为示例占位（姓名、学校、项目、GitHub、邮箱），发布前必须替换 | 中 | 已知，待内容替换 |
| DEF-02 | `resume.pdf` 为 931 B 占位文件，不可作为真实简历投递 | 中 | 已知，待替换 |
| DEF-03 | 浅色主题 `--muted`（3.39:1）、`--accent`（3.65:1）用于小字号时低于 AA 4.5:1 | 低 | 待视觉验收确认 |
| DEF-04 | 3 处项目「查看详情」与 6 处作品卡使用 `href="#"`，点击无跳转 | 中 | 待替换为真实链接 |
| DEF-05 | 移动菜单打开后未做焦点陷阱，Tab 可移出菜单到页面主体 | 低 | 待改进 |
| DEF-06 | 服务器尚未购买，部署与线上验证整体阻塞 | 阻塞 | 待外部条件 |

## 10. 测试结论与遗留风险

| 检查域 | 结论 |
|---|---|
| 静态检查 | 4 项全部通过 ✅ |
| 功能用例 | 18 条均有代码依据，17 条走查通过、1 条（无 JS 降级）待浏览器；**尚无浏览器实测记录** |
| 响应式 / 兼容性 | 断点与降级逻辑已实现，全部待人工/真机验证 ⏳ |
| 可访问性 | 语义与键盘基础较好，对比度与菜单焦点管理有两处已知限制 ⚠️ |
| 部署 / 性能 | 未执行，不能宣称通过 ⏳ |

一句话总结：**代码层面已完成且静态检查全部通过，但「浏览器视觉走查、真机测试、Lighthouse、线上访问」四项尚未执行，验收前必须补齐。**

| 遗留风险 | 影响 | 应对 |
|---|---|---|
| 示例内容未替换 | 无法作为求职作品集使用 | 按 `docs/content-checklist.md` 逐项替换并打勾 |
| 真实素材替换后布局被撑破 | 排版返工 | 替换后重跑第 5 节视口矩阵 |
| 真机与浏览器差异 | 移动端体验问题 | 至少在 2 台真机（Android + iOS）各走一遍 |
| 服务器购买/认证延迟 | 无法完成硬性验收项 | 提前购买；兜底为本地演示 + 部署录屏 |
| Lighthouse 未达标 | 性能目标未证明 | 实测后按报告优化，不修改目标值凑分 |

验收前待办：替换全部示例内容与简历 PDF 并清除 `TODO`；Chrome/Edge 完成第 4 节 18 条用例；320–1920 逐档走查；手机 4G 真机访问并截图；执行 Lighthouse 并存档原始报告；服务器就绪后执行第 7 节 DP-01～DP-09；最后把本报告更新为 v1.0。
