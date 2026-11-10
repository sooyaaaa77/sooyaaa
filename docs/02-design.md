# 02 · 技术设计与视觉规范

> 状态：v0.1 初稿 ｜ 最后更新：2026-11-10

## 1. 设计目标

参考 [pudding.cool](https://pudding.cool/) 的气质，做一个**有编辑感**的个人站点：

- 杂志式排版：大字号标题、强烈的字号对比、宽留白
- 滚动叙事：内容随着滚动逐段出现，而不是一次性铺满
- 克制的动效：动效服务于阅读节奏（进场、悬停、视差），不喧宾夺主
- 细节感：手写感下划线、旋转星形、贴纸标签、噪点纸张质感
- 取舍：两周内**不做**自定义插画与数据可视化，改用 CSS 图形、内联 SVG 与系统字体替代

## 2. 技术选型

| 方案 | 结论 | 理由 |
|---|---|---|
| **纯静态 HTML / CSS / JS** | ✅ 采用 | 零构建、零依赖；部署 = 上传文件；与「手动部署」考核最匹配；出问题最好排查 |
| Vite + Vue 3 | ❌ 否决 | 需要 Node 构建、产物部署多一层变量；两周内调试成本高 |
| Astro / Next.js | ❌ 否决 | 概念多、构建链复杂，收益与风险不匹配 |
| GitHub Pages / Vercel / Netlify | ❌ 禁止 | 老师明确不允许托管服务，必须自己部署服务器 |
| 宝塔面板 / LNMP 一键包 / 应用镜像 | ❌ 禁止 | 要求手动装 Nginx、手动配置 |

**字体策略**：只用系统字体栈（`Iowan Old Style / Palatino / Georgia / 宋体` + `PingFang / 微软雅黑`），
不引入 Google Fonts 等外部资源，避免国内加载失败与首屏闪白。

**图形策略**：装饰图形用内联 SVG 和 CSS（渐变、圆形、旋转星形），作品图先用 CSS 占位，
后续替换为真实截图即可。

## 3. 信息架构

```
个人网站
├── 首屏 Hero            姓名、定位、CTA、滚动提示
├── 滚动横幅 Marquee     关键词循环滚动
├── 01 关于我           自我介绍、引语、数字统计
├── 02 教育经历         时间线、主修课程、荣誉
├── 03 技能栈           分类标签
├── 04 项目经历         3 个项目卡片，深色区块
├── 05 作品集           6 张作品占位卡片
├── 06 联系我           邮箱、GitHub、简历
├── 页脚                 版权、版本号、部署信息
└── 404.html            错误页
```

单页锚点导航，不做多页；后续若加学习笔记再扩成多页。

## 4. 区块说明

| 区块 | 目标 | 关键内容 | 交互 |
|---|---|---|---|
| Hero | 5 秒内让人记住"你是谁、要什么" | 大号姓名、定位句、元信息、简历/项目按钮 | 进场动画、装饰视差、贴纸 |
| Marquee | 节奏过渡 | 关键词重复：OPEN TO WORK / 计算机 / 求职方向 | 无限滚动，悬停暂停 |
| 关于我 | 建立人格化印象 | 三段介绍 + 一句引语 + 4 个数字 | 滚动进场、数字从 0 增长 |
| 教育经历 | 证明基础 | 时间线：学校/专业/课程/荣誉 | 进场 |
| 技能栈 | 快速扫读 | 4 组标签，正在学习单独一句 | 标签悬停变色 |
| 项目经历 | 核心证据 | 编号、标题、描述、技术栈、角色、链接 | 卡片悬停倾斜、箭头位移 |
| 作品集 | 直观印象 | 占位图形 + 标题 + 说明 | 悬停放大 |
| 联系我 | 转化 | 大号邮箱、GitHub、简历、回到顶部 | 链接下划线动画 |
| 页脚 | 收束 | 版权、技术栈、版本号 | — |

## 5. 视觉规范

### 5.1 色板（CSS 变量）

| 变量 | 浅色 | 深色 | 用途 |
|---|---|---|---|
| `--paper` | `#f4efe4` | `#151310` | 页面底色（纸张感） |
| `--paper-2` | `#ece4d4` | `#1d1a16` | 交替区块底色 |
| `--ink` | `#1b1814` | `#f0e9db` | 主文字 / 反色块 |
| `--ink-2` | `#4b4338` | `#c9bfae` | 次要文字 |
| `--muted` | `#8a8071` | `#938876` | 辅助信息 |
| `--accent` | `#d64f2a` | `#ff6b3d` | 强调色（朱红） |
| `--line` | `rgba(27,24,20,.16)` | `rgba(240,233,219,.18)` | 分隔线 |

### 5.2 字体与字号

- 展示字体：`"Iowan Old Style", "Palatino Linotype", Georgia, "Noto Serif SC", "Songti SC", serif`
- 正文字体：`"Inter", "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif`
- 等宽字体：`"SFMono-Regular", Consolas, monospace`（用于编号、标签、版本号）
- 字号阶梯（clamp 实现流体排版）：

| 层级 | 尺寸 |
|---|---|
| Hero 姓名 | `clamp(3.2rem, 11.5vw, 9.5rem)` |
| 区块标题 | `clamp(2.2rem, 5.2vw, 4.4rem)` |
| 项目标题 | `clamp(1.7rem, 3vw, 2.6rem)` |
| 正文 | `1rem / 1.8` |
| 小标签 | `12px` + `letter-spacing: .16em` |

### 5.3 间距与栅格

- 内容最大宽度 `1180px`，左右留白 `clamp(20px, 5vw, 56px)`
- 区块上下内边距 `clamp(80px, 11vw, 150px)`
- 卡片圆角 `20px`，按钮/标签圆角 `999px`

### 5.4 动效参数

| 参数 | 值 |
|---|---|
| 快速反馈（悬停） | `.2s` |
| 常规过渡 | `.5s cubic-bezier(.2, .7, .2, 1)` |
| 进场动画 | `.9s`，位移 `26px`，逐级延迟 `.05–.35s` |
| 数字滚动 | `1200ms`，easeOutCubic |

## 6. 交互与动效清单

| 效果 | 实现方式 | 降级策略 |
|---|---|---|
| 区块进场 | IntersectionObserver 添加 `.is-in` | 无 JS 时默认显示 |
| 数字增长 | requestAnimationFrame | 减少动效时直接显示终值 |
| 滚动进度条 | scroll 事件计算百分比 | — |
| 首屏装饰视差 | mousemove + rAF | 触屏/减少动效时关闭 |
| 自定义光标 | 两个 div + rAF 跟随 | 触屏设备隐藏 |
| 卡片倾斜 | mousemove 计算 rotateX/Y | 默认无倾斜 |
| 跑马灯 | CSS animation `translateX(-50%)` | 悬停暂停 |
| 深色模式 | `[data-theme]` + localStorage | 不记忆也可用 |
| 移动端菜单 | 全屏遮罩 + class 切换 | 无 JS 时直接显示锚点 |
| 导航高亮 | IntersectionObserver 监听区块 | 不影响功能 |

所有交互基于原生 API，**不引入任何第三方库**。

## 7. 文件结构

```
个人网站/
├── index.html            # 单页主文件（含全部区块）
├── 404.html              # 错误页
├── style.css             # 全部样式（变量 → 重置 → 组件 → 区块 → 响应式 → 深色）
├── main.js               # 全部交互（IIFE，无模块依赖）
├── favicon.svg
├── resume.pdf            # 简历占位（TODO 替换）
├── deploy/
│   └── nginx.conf        # 服务器 Nginx 站点配置模板
├── scripts/
│   └── deploy.sh         # 一键上传脚本（tar over ssh）
├── docs/                 # 全部 Markdown 文档
└── .gitignore
```

## 8. 内容维护方式

- 文字内容直接写在 `index.html` 对应区块，占位内容有 `<!-- TODO: ... -->` 注释；
- 替换清单见 `docs/content-checklist.md`，逐项打勾；
- 换配色只改 `style.css` 顶部变量；换字体只改 `--font-*` 变量。

## 9. 性能 / SEO / 可访问性

- **性能**：无外链字体、无图片依赖（占位为 CSS 图形）；单文件 CSS/JS；只对 transform/opacity 做动画
- **SEO**：`<title>`、`description`、`og:*`、语义化 `header/main/section/footer`、单一 `h1`
- **可访问性**：skip link、`aria-*`、键盘可达、`:focus-visible`、`prefers-reduced-motion`、对比度达标

## 10. 部署架构

```
浏览器 ──HTTP:80──> 阿里云 ECS (Ubuntu 22.04, 公网 IP)
                        └── Nginx ──> /var/www/mysite/  (index.html, style.css, ...)
未来扩展（可选）：域名 A 记录 → ICP 备案 → HTTPS（certbot）→ HTTP/2
```

部署步骤、排错与安全加固见 `docs/04-deploy.md`。
