/* ============================================================
   scripts/screenshot.mjs
   用本机 Edge/Chrome 的无头模式 + DevTools 协议截图，用于本地视觉检查。
   用法：node scripts/screenshot.mjs [desktop|mobile|dark|menu|notfound|all]
   产物写到 previews/（已在 .gitignore 中忽略）。
   仅开发自检用，不参与部署。
   ============================================================ */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const outDir = join(root, "previews");
mkdirSync(outDir, { recursive: true });

const BROWSERS = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
];
const browser = BROWSERS.find((p) => existsSync(p));
if (!browser) {
  console.error("未找到 Edge/Chrome。");
  process.exit(1);
}

const mode = process.argv[2] || "all";
const profile = join(tmpdir(), "portfolio-shot-profile-" + Date.now());
const port = 9333;

const edge = spawn(
  browser,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--hide-scrollbars",
    "--remote-debugging-port=" + port,
    "--user-data-dir=" + profile,
    "about:blank",
  ],
  { stdio: "ignore" }
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function targetWs() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      /* 浏览器尚未就绪 */
    }
    await sleep(200);
  }
  throw new Error("等待 DevTools 超时");
}

const wsUrl = await targetWs();
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => {
  ws.addEventListener("open", res, { once: true });
  ws.addEventListener("error", rej, { once: true });
});

let msgId = 0;
const pending = new Map();
ws.addEventListener("message", (ev) => {
  const data = JSON.parse(ev.data);
  if (data.id && pending.has(data.id)) {
    const { resolve: ok, reject } = pending.get(data.id);
    pending.delete(data.id);
    if (data.error) reject(new Error(data.error.message));
    else ok(data.result);
  }
});

function send(method, params = {}) {
  const id = ++msgId;
  return new Promise((ok, reject) => {
    pending.set(id, { resolve: ok, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalJs(expression) {
  const r = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  return r.result ? r.result.value : undefined;
}

async function capture(name, width, height, opts = {}) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 2,
    mobile: width < 700,
  });
  await send("Page.navigate", { url: opts.url || pathToFileURL(join(root, "index.html")).href });
  await sleep(1500);

  /* 截图用：禁用平滑滚动，并强制显示进场元素与统计数字（真实浏览由 JS 触发） */
  await evalJs(
    "const s=document.createElement('style');s.textContent='html{scroll-behavior:auto !important} [data-reveal]{opacity:1 !important;transform:none !important}';document.head.appendChild(s);true"
  );
  await evalJs(
    "document.querySelectorAll('.stat__num').forEach(el=>{el.textContent=(el.dataset.count||'')+(el.dataset.suffix||'')});true"
  );

  if (opts.dark) {
    await evalJs(
      "localStorage.setItem('portfolio-theme','dark'); document.documentElement.setAttribute('data-theme','dark'); true"
    );
  } else if (opts.light) {
    await evalJs(
      "localStorage.setItem('portfolio-theme','light'); document.documentElement.setAttribute('data-theme','light'); true"
    );
  }
  await sleep(400);

  if (opts.menu) {
    await evalJs("document.getElementById('menu-btn').click(); true");
    await sleep(600);
  }

  /* 滚到底再回顶，触发所有入场动画 */
  await evalJs("window.scrollTo(0, document.body.scrollHeight); true");
  await sleep(900);
  await evalJs("window.scrollTo(0, 0); true");
  await sleep(900);
  const scrollY = await evalJs("window.scrollY");
  if (scrollY !== 0) console.warn("滚动未归零：", scrollY);

  const full = opts.full !== false;
  let clip;
  if (full) {
    const m = await send("Page.getLayoutMetrics");
    const size = m.cssContentSize || m.contentSize;
    clip = { x: 0, y: 0, width, height: Math.min(size.height, 14000), scale: 1 };
  }
  const shot = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: full,
    ...(clip ? { clip } : {}),
  });
  const file = join(outDir, name + ".png");
  writeFileSync(file, Buffer.from(shot.data, "base64"));
  console.log("已保存", file);
}

try {
  await send("Page.enable");
  await send("Runtime.enable");

  if (mode === "desktop" || mode === "all") {
    await capture("desktop-full", 1440, 900);
    await capture("desktop-hero", 1440, 900, { full: false });
  }
  if (mode === "mobile" || mode === "all") {
    await capture("mobile-full", 390, 844);
    await capture("mobile-hero", 390, 844, { full: false });
  }
  if (mode === "dark" || mode === "all") {
    await capture("dark-full", 1440, 900, { dark: true });
  }
  if (mode === "menu" || mode === "all") {
    await capture("menu-open", 390, 844, { light: true, menu: true, full: false });
    await capture("menu-open-dark", 390, 844, { dark: true, menu: true, full: false });
  }
  if (mode === "notfound" || mode === "all") {
    await capture("notfound", 1440, 900, {
      url: pathToFileURL(join(root, "404.html")).href,
      light: true,
    });
  }
} finally {
  try {
    ws.close();
  } catch {}
  edge.kill();
  await sleep(300);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {}
}
