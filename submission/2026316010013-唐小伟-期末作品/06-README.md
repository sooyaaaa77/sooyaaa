# 个人作品集网站 · Portfolio

> 计算机科学与技术专业 2024 级 · UE5 × 传媒交叉方向 · 求职用个人作品集（课程项目）

一个**纯静态**的个人作品集：HTML / CSS / JavaScript 手写实现，无框架、无构建步骤、无第三方依赖，
视觉参考 [pudding.cool](https://pudding.cool/) 的白底编辑风格：白纸黑字、单一红色点缀、贴纸式图形、吸顶章节导航与克制的动效，
手动部署到云服务器（Ubuntu + Nginx），通过公网 IP 访问。

> ✅ 已在公网运行：<http://43.136.175.239> · 源码仓库：<https://github.com/sooyaaaa77/sooyaaa> · 页面视觉已定稿（v0.3，示例内容待替换）

## 快速预览

无需安装任何依赖，两种方式任选：

1. 直接双击打开 `index.html`（或拖进浏览器）；
2. 在项目目录执行：

```bash
python -m http.server 8080
# 浏览器访问 http://localhost:8080
```

## 功能特性

- **区块**：Masthead、吸顶章节导航、首屏 Hero、关于我、教育经历、技能栈、项目经历、个人作品、联系方式、页脚
- **主题**：深色 / 浅色一键切换，跟随系统偏好，`localStorage` 记住选择
- **动效**：进场动画、数字滚动计数、滚动进度条、吸顶导航章节高亮、悬停位移与旋转（不使用自定义光标 / 跑马灯 / 视差）
- **响应式**：1020px / 900px / 720px / 620px 四档断点，移动端全屏菜单（含焦点陷阱）
- **视觉**：纯白底、衬线大标题、黑色描边贴纸与胶囊按钮、红色手写下划线、6 张低饱和卡纸作品块、深色主题
- **可访问性**：语义化结构、skip-link、键盘可操作、移动菜单焦点陷阱、`aria-*` 状态同步、对比度达 AA、尊重 `prefers-reduced-motion`
- **部署**：静态文件 + Nginx 配置 + 一键部署脚本 + 自定义 404 页

## 目录结构

```text
.
├── index.html              # 单页站点（所有内容）
├── 404.html                # 自定义 404 页
├── style.css               # 全部样式（设计变量 / 组件 / 响应式）
├── main.js                 # 全部交互（主题 / 动效 / 菜单）
├── favicon.svg             # 站点图标
├── resume.pdf              # 占位简历（需替换为真实简历）
├── deploy/
│   └── nginx.conf          # 服务器 Nginx 站点配置模板
├── scripts/
│   ├── deploy.sh           # 一键部署：打包 → 上传 → 解压 → reload
│   └── screenshot.mjs      # 无头浏览器截图自检（开发用，不部署）
├── docs/                   # 全部项目文档（Markdown）
│   ├── 01-requirements.md  # 需求分析
│   ├── 02-design.md        # 技术设计
│   ├── 03-plan.md          # 实施计划
│   ├── 04-deployment.md    # 部署手册
│   ├── 05-git-record.md    # Git 提交记录
│   ├── 06-ai-usage.md      # AI 使用说明
│   ├── 07-testing.md       # 测试报告
│   ├── 08-summary.md       # 项目总结
│   └── content-checklist.md# 内容替换清单
└── README.md
```

## 技术栈

| 层面 | 选择 | 理由 |
| --- | --- | --- |
| 页面 | HTML5 + CSS3（变量 / Grid / clamp） | 零构建，打开即用，部署最简单 |
| 交互 | 原生 JavaScript（IntersectionObserver、requestAnimationFrame） | 不引入框架，体积小，可完全讲清楚 |
| 字体 | 系统字体栈 | 不加载外链字体，首屏快、离线可用 |
| 版本管理 | Git（Conventional Commits） | 每次改动可回溯 |
| 部署 | 阿里云 ECS（Ubuntu 22.04）+ apt 安装 Nginx | 手动配置，不使用任何面板/一键包 |

## 部署

完整步骤见 [docs/04-deployment.md](docs/04-deployment.md)。简版：

```bash
# 1. 配置好站点（首次）
scp deploy/nginx.conf root@<服务器IP>:/tmp/mysite.conf
# 服务器上：移动到 sites-available、改 server_name、软链、nginx -t、reload

# 2. 每次发布
./scripts/deploy.sh root@<服务器IP>
```

## 文档

所有项目文档使用 Markdown 撰写，位于 [`docs/`](docs/)：

- [需求分析](docs/01-requirements.md) — 需求、约束、验收标准
- [技术设计](docs/02-design.md) — 参考站点解构、选型取舍、设计规范
- [实施计划](docs/03-plan.md) — 两周排期、里程碑、提交计划
- [部署手册](docs/04-deployment.md) — 从买服务器到公网访问
- [Git 提交记录](docs/05-git-record.md) — 关键提交与阶段说明
- [AI 使用说明](docs/06-ai-usage.md) — 哪些用了 AI、如何把关
- [测试报告](docs/07-testing.md) — 测试用例与结果
- [项目总结](docs/08-summary.md) — 复盘、收获与改进
- [内容替换清单](docs/content-checklist.md) — 发布前逐项勾选

## 发布前必做

1. 按 [content-checklist.md](docs/content-checklist.md) 替换全部示例内容；
2. 用真实简历替换 `resume.pdf`；
3. 购买服务器并按部署手册完成上线；
4. 手机流量验证公网访问。

## 许可

仅供学习与个人使用。代码可自由参考，请勿直接使用示例中的个人信息冒充他人。
