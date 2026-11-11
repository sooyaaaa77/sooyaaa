# 技术设计与视觉规范

> 状态：v0.3（白底贴纸编辑风） ｜ 最后更新：2026-11-11
>
> 本文回答三个问题：**做什么样**、**为什么这样**、**具体怎么做**。实现细节以仓库中的 `index.html`、`style.css`、`main.js` 为准，本文记录设计决策与可复用的规范。

---

## 1. 设计目标

| 目标 | 含义 | 落地手段 |
| --- | --- | --- |
| 像一份编辑物，而不是模板 | 有版面感、留白、层级，看得出「设计过」 | 衬线大标题、等宽小标签、严格栅格 |
| 黑白为主，红色点睛 | 颜色收敛，避免花哨；红只出现在小面积 | 纸白 + 墨黑 + 单一强调红，色块只留在作品封面 |
| 贴纸语言 | 呼应参考站 pudding.cool，但只借语言不抄内容 | 白底黑边贴纸、胶囊按钮、硬阴影、轻微旋转 |
| 名字不喧宾夺主 | 首屏重点是「我在做什么」，不是巨型姓名 | 姓名放进正文第一句，标题用一句话定位 |
| 手机可读 | 单列、字号可读、导航可达 | 断点 1020 / 900 / 720 / 620，移动端全屏菜单 |

> 设计参考：<https://pudding.cool/> 的版式与贴纸体系（黑白、大标题、等宽标签、硬阴影、轻旋转）。只借鉴视觉语言，不复制其内容与品牌元素。

---

## 2. 技术选型（不变）

| 方案 | 结论 | 原因 |
| --- | --- | --- |
| 纯静态 HTML + CSS + JS | ✅ 采用 | 无构建、无依赖，`scp`/`git pull` 后 Nginx 直接托管；老师关注部署流程，不关注框架 |
| Vue / React / Next / Astro | ❌ 不采用 | 引入构建链与依赖，部署、排错、答辩解释成本都变高，对本项目没有收益 |
| 静态站点托管（Pages / Vercel / Netlify） | ❌ 禁止 | 作业明确要求云服务器 + Nginx 手动部署 |
| 面板 / 一键包（宝塔、LNMP） | ❌ 禁止 | 作业要求掌握命令行部署过程 |
| 外链字体 / CDN / 第三方 JS | ❌ 不引入 | 公网可用性不可控；首屏更快；无隐私与许可证问题 |

结论：**零依赖、零构建、可离线打开**。所有视觉与交互都在 6 个文件里：`index.html`、`style.css`、`main.js`、`404.html`、`favicon.svg`、`resume.pdf`。

---

## 3. 信息架构

```
┌─ masthead（滚动离开）
│   tagline 两行 │ 贴纸 logo │ 三个胶囊入口 + 主题切换 + 菜单按钮
├─ subnav（吸顶，sticky top:0）
│   INDEX │ 01 关于 │ 02 教育 │ 03 技能 │ 04 项目 │ 05 作品 │ 06 联系
├─ #top   hero      定位句 + 简介 + 求职信息 + 两个 CTA ＋ 封面卡
├─ #about 01 关于   照片位 + 三段自述 + 一句话引用 + 四个数字
├─ #education 02    两条时间线（学校 / 工作室）
├─ #skills 03       四组工具 chips + 正在学习
├─ #projects 04     三个项目（编号 + 日期 + 封面 + 标题 + 我负责的 + 结果 + 标签）
├─ #works 05        六张练习卡（编号 + 年份 + 卡纸封面 + 线性图标 + 标题）
├─ #contact 06      大邮箱 CTA + GitHub / 简历 / 回到顶部
└─ footer           品牌 + SITE + CONNECT + 版权与课程说明
```

设计取舍：

| 决策 | 理由 |
| --- | --- |
| 首屏不放巨型姓名 | 用户要求「名字不需要那么突出」；招聘方先看方向与作品，姓名在正文第一句出现即可 |
| 章节导航吸顶 | 长页面需要随时可跳转；参考站的搜索/过滤器吸顶同理 |
| 删除滚动横幅 marquee | 用户明确要求去掉；且横幅与「克制」的编辑风冲突 |
| 项目用「左窄右宽」行式布局 | 比三列卡片更像作品集目录，也更容易写清「我负责什么」 |
| 作品卡统一 6 张 | 数量可控、栅格整齐；真实截图到位后逐张替换卡纸内容即可 |
| 联系区用大邮箱而非表单 | 静态站无后端，`mailto:` 最可靠；表单需要服务端或第三方，增加部署复杂度 |

---

## 4. 视觉规范

### 4.1 色板

| Token | 值 | 用途 |
| --- | --- | --- |
| `--paper` | `#ffffff` | 页面主底色 |
| `--paper-2` | `#f7f7f4` | 交替区块底色（教育 / 作品） |
| `--ink` | `#111110` | 主文字、黑底贴纸、主按钮 |
| `--ink-2` | `#3a3a36` | 次级正文 |
| `--muted` | `#6b6b66` | 说明文字、时间、标签 |
| `--faint` | `#a3a39e` | 仅装饰性细线/序号（不承载信息） |
| `--line` / `--line-strong` | `#e4e4de` / `#c9c9c2` | 分隔线、描边 |
| `--accent` | `#cf3a22` | 唯一的强调红：下划线、圆点、小标签 |
| `--accent-solid` | `#cf3a22` | 红底白字组件（封面角标、红贴纸、结果标签） |
| `--accent-soft` | `#f7e3dd` | 红色浅底（悬停背景） |
| `--mat-1…6` | `#f3ddd4` `#f2ecd6` `#e7e3ef` `#dee9e3` `#f4e8dc` `#e9e9e6` | 作品封面卡纸的低饱和色 |

深色主题（`[data-theme="dark"]`）：`--paper #121211`、`--paper-2 #191917`、`--ink #f4f2ec`、`--ink-2 #d8d5cc`、`--muted #a6a39a`、`--line #2c2c28`、`--accent #ff6a4d`（深底上更亮），红底组件仍用 `--accent-solid` 保证白字对比度。

**对比度实测（WCAG AA 正文 ≥ 4.5:1）**：

| 组合 | 比值 | 结论 |
| --- | --- | --- |
| ink / paper | 18.89 | ✅ |
| ink-2 / paper | 11.42 | ✅ |
| muted / paper | 5.36 | ✅ |
| muted / paper-2 | 4.99 | ✅ |
| accent / paper | 4.90 | ✅ |
| 白字 / accent-solid | 4.90 | ✅ |
| 白字 / 深色 accent（#ff6a4d） | 2.83 | ❌ 不使用，深色下红底组件仍用 accent-solid |
| 深色 ink / 深色 paper | 16.57 | ✅ |
| 深色 muted / 深色 paper | 7.32 | ✅ |
| 深色 accent / 深色 paper | 6.62 | ✅ |

> 颜色使用红线：**红只做小面积点缀**（下划线、圆点、角标、结果标签），不做大块背景；作品色只出现在封面卡纸，且用低饱和色。姓名、正文、大标题一律墨黑。

### 4.2 字体

| 角色 | 字体栈 | 用法 |
| --- | --- | --- |
| 标题（衬线） | `Georgia, "Songti SC", "Noto Serif SC", "SimSun", serif` | hero 定位句、区块标题、项目标题、作品标题 |
| 正文（无衬线） | `"Helvetica Neue", Helvetica, "PingFang SC", "Microsoft YaHei", Arial, sans-serif` | 段落、说明、按钮 |
| 标签（等宽） | `"SF Mono", "Cascadia Mono", Menlo, Consolas, "Courier New", monospace` | eyebrow、编号、日期、meta 标签、页脚 |

字号（`clamp()` 响应式）：

| 名称 | 值 |
| --- | --- |
| hero 标题 | `clamp(32px, 4.6vw, 58px)`，行高 1.18，字重 700 |
| 区块标题 | `clamp(27px, 3.3vw, 42px)`，行高 1.22 |
| 项目标题 | `clamp(21px, 2.2vw, 27px)` |
| 引导句 lede | 17px / 1.9 |
| 正文 | 15px / 1.9（`--muted` 用于说明） |
| 小标签 | 9.5–11px，大写，字距 0.08–0.36em |

中文字体不下载外部字库，直接用系统衬线（Windows 宋体 / macOS 宋体-简 / Android Noto Serif）。**这是有意的取舍**：体积为 0、离线可用，代价是不同系统字形略有差异；如果以后要严格统一，再自托管子集字体。

### 4.3 栅格与间距

| 项 | 值 |
| --- | --- |
| 内容最大宽度 | 1120px |
| 页边距 | `clamp(20px, 5vw, 52px)` |
| 区块上下留白 | `clamp(56px, 7vw, 92px)` |
| 吸顶导航高度 | 52px |
| 圆角 | 4px（卡片/按钮）、12–999px（贴纸/胶囊） |
| 描边 | 1.4px（细）、1.5px（贴纸）、2.5px（封面卡纸）、3px（封面外框） |
| 进场节奏 | `cubic-bezier(.2,.7,.2,1)`，位移 14–24px，时长 520–900ms |

### 4.4 贴纸组件规格

```
背景 #fff（深色为主题底色）
边框 1.5px solid var(--ink)
圆角 999px（胶囊）/ 6–12px（方形贴纸）
阴影 2px 3px 0 rgba(17,17,16,.14)
旋转 -4deg ~ 6deg（逐个手调，不要统一）
内边距 6px 12px ~ 9px 16px
字体 等宽大写，字距 0.1em
```

变体：`--red` 红底白字（`accent-solid`）、`--outline` 白底黑字、`--dashed` 虚线描边（项目入口用，模拟手绘圈注）。

---

## 5. 区块与组件

| 区块 | 结构要点 | 交互 |
| --- | --- | --- |
| masthead | 三列 grid；左 tagline，中 logo 贴纸，右胶囊组 | 无（滚动离开） |
| subnav | `position: sticky; top: 0`；INDEX + 6 chip | 滚动时高亮当前章节（JS 观察器），点击锚点跳转 |
| hero | 两列：左文案 + CTA，右封面卡 | 进场位移；封面卡轻微旋转 |
| cover | 3px 黑框 + 内层卡纸 + 斜纹占位 + 播放圆钮 + FEATURED 角标 | 悬停微抬 |
| about | 左照片位（相机图标 + PHOTO 贴纸），右三段文字 + 引用 + 四数字 | 数字滚动计数 |
| timeline | 年份列 + 标题 + 描述 + 标签 | 悬停标签变黑底白字 |
| skills | 两列四组，组内 chips | chips 悬停反色 |
| projects | 每行：左 190px（编号 + 日期 + 封面），右标题/描述/结果/标签/详情 | 悬停封面轻抬，详情箭头位移 |
| works | 3 列（手机 1 列）卡纸 + 线性图标 | 悬停上浮 + 硬阴影加深 |
| contact | 大邮箱卡 + 右侧三行链接 | 悬停下划线展开 |
| footer | 品牌 + 红贴纸，SITE / CONNECT 两列 | 回到顶部 |

### 交互清单

1. 滚动进度条（顶部 2px 红线，`transform: scaleX`）。
2. 进场：`[data-reveal]` + IntersectionObserver，加 `.is-in`；`prefers-reduced-motion` 下直接显示。
3. 数字滚动：`.stat__num[data-count]`，进入视口后 1200ms 缓动到目标值，保留后缀。
4. 吸顶导航高亮：观察各 `section[id]`，在视口中部命中时给对应 chip 加 `.is-active`。
5. 移动菜单：全屏面板，`hidden` 切换 + `aria-expanded`；开菜单焦点移到第一个链接，`Tab` 循环，`Esc` 关闭并回归菜单按钮。
6. 主题切换：`localStorage` 键 `portfolio-theme`，默认浅色；`<head>` 内联脚本首帧前应用，避免闪烁。
7. 不使用的：自定义光标、视差、跑马灯（v0.3 已移除，减少干扰与实现面）。

---

## 6. 文件结构

```
.
├── index.html          # 单页，六个区块 + 页脚
├── style.css           # 设计变量、组件、响应式、深色、降动效
├── main.js             # 主题 / 进度 / 进场 / 数字 / 吸顶高亮 / 菜单
├── 404.html            # 与主站同风格
├── favicon.svg         # 黑底圆角 + 白衬线「唐」+ 红点
├── resume.pdf          # 占位，交付前替换真实简历
├── deploy/nginx.conf   # 站点配置模板
├── scripts/deploy.sh   # tar + scp + ssh 发布脚本
├── scripts/screenshot.mjs # 本地无头截图自检（Edge DevTools 协议）
├── docs/               # 01–08 文档
└── README.md
```

---

## 7. 性能、SEO、可访问性

| 项 | 做法 |
| --- | --- |
| 体积 | 6 个静态文件，无字体、无图片（占位用 CSS/SVG）；gzip 后约 15–20KB |
| 首屏 | 无阻塞脚本（`defer`），主题脚本内联在 `<head>` 防闪白/闪黑 |
| SEO | `title`、`description`、`og:title/description/type`、语义化标签、唯一 `h1`、`lang="zh-CN"` |
| 可访问性 | 跳转链接、`aria-label`、`aria-expanded`、`aria-current`、焦点可见、装饰元素 `aria-hidden`、对比度全部 AA、`prefers-reduced-motion` 关闭动效 |
| 404 | Nginx `error_page 404 /404.html`，页面内返回首页与邮箱 |

---

## 8. 部署架构

```
浏览器 ──HTTP:80──▶ 云服务器（Ubuntu 22.04）
                     └─ Nginx（静态文件，root /var/www/mysite）
                          ├─ index.html / style.css / main.js / favicon.svg
                          ├─ resume.pdf（下载）
                          └─ 404.html
部署方式（命令行，无面板）：
  本地 git commit ──▶ 服务器 git pull（或 scripts/deploy.sh 打包 scp）
                    └─ nginx -t && systemctl reload nginx
```

- 本期用「公网 IP」访问，不买域名、不做备案与 HTTPS（列为选做扩展，见 `docs/04-deployment.md`）。
- 服务器购买、SSH 配置、Nginx 安装与发布流程全部记录在 `docs/04-deployment.md`。

---

## 9. 内容维护约定

- 页面内所有示例内容均带 `TODO` 注释；替换清单见 `docs/content-checklist.md`。
- 真实内容直接改 `index.html`（单页、无模板引擎），改完本地 `python -m http.server` 预览，再提交。
- 图片素材统一放 `assets/`（尚未创建）；替换前作品卡用线性 SVG 图标占位，不引入图片请求。
- 简历 `resume.pdf` 当前是占位文件，替换为真实 PDF 时保持文件名不变，`下载简历` 链接无需修改。
