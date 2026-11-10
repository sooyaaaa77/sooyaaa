/* ============================================================
   个人作品集 · main.js
   原生 JavaScript，无第三方依赖。
   基础部分：主题切换 / 滚动进度条 / 导航状态 / 进场动画 / 移动菜单
   ============================================================ */
(function () {
  "use strict";

  var root = document.documentElement;
  var $ = function (sel, ctx) {
    return (ctx || document).querySelector(sel);
  };
  var $$ = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  };
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. 主题切换 ---------- */
  var THEME_KEY = "portfolio-theme";
  var themeBtn = $("#theme-toggle");

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (themeBtn) {
      themeBtn.setAttribute("aria-label", theme === "dark" ? "切换到浅色主题" : "切换到深色主题");
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", theme === "dark" ? "#151310" : "#f4efe4");
    }
  }

  function readSavedTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch (e) {
      return null;
    }
  }

  var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(readSavedTheme() || (systemDark ? "dark" : "light"));

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (e) {
        /* 忽略存储失败 */
      }
    });
  }

  /* ---------- 2. 滚动进度条与导航状态 ---------- */
  var bar = $("#progress-bar");
  var nav = $("#nav");

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    if (bar) {
      bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
    }
    if (nav) {
      nav.classList.toggle("is-scrolled", window.scrollY > 24);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 3. 进场动画（IntersectionObserver） ---------- */
  var revealItems = $$("[data-reveal]");

  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (el) {
      el.classList.add("is-in");
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealItems.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ---------- 4. 移动端全屏菜单 ---------- */
  var menuBtn = $("#menu-btn");
  var mobileMenu = $("#mobile-menu");

  function setMenu(open) {
    if (!menuBtn || !mobileMenu) return;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    mobileMenu.setAttribute("aria-hidden", String(!open));
    mobileMenu.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
  }

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", function () {
      setMenu(menuBtn.getAttribute("aria-expanded") !== "true");
    });
    $$("a", mobileMenu).forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false);
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
  }

  /* ---------- 5. 页脚年份 ---------- */
  var yearEl = $("#year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  /* ---------- 6. 数字滚动（关于我 · 数据统计） ---------- */
  var statNums = $$(".stat__num");

  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var suffix = el.getAttribute("data-suffix") || "";
    if (isNaN(target)) return;
    if (prefersReduced) {
      el.textContent = target + suffix;
      return;
    }
    var duration = 1200;
    var start = performance.now();
    function tick(now) {
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if (statNums.length) {
    if (prefersReduced || !("IntersectionObserver" in window)) {
      statNums.forEach(countUp);
    } else {
      /* 先归零，等滚动到可见区域再计数；无 JS 时保留 HTML 里的最终数值 */
      statNums.forEach(function (el) {
        el.textContent = "0" + (el.getAttribute("data-suffix") || "");
      });
      var statObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              countUp(entry.target);
              statObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      statNums.forEach(function (el) {
        statObserver.observe(el);
      });
    }
  }

  /* ---------- 7. 自定义光标（带延迟圆环） ---------- */
  var dot = $(".cursor");
  var ring = $(".cursor-ring");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (dot && ring && finePointer && !prefersReduced) {
    var mouseX = window.innerWidth / 2;
    var mouseY = window.innerHeight / 2;
    var ringX = mouseX;
    var ringY = mouseY;

    document.addEventListener("mousemove", function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      document.body.classList.add("has-cursor");
    });

    document.addEventListener("mouseleave", function () {
      document.body.classList.remove("has-cursor");
    });

    document.addEventListener("mouseover", function (e) {
      var target = e.target;
      var interactive = target.closest ? target.closest("a, button, .chips li") : null;
      ring.classList.toggle("is-hover", Boolean(interactive));
    });

    (function moveCursor() {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      dot.style.transform = "translate3d(" + mouseX + "px," + mouseY + "px,0) translate(-50%,-50%)";
      ring.style.transform = "translate3d(" + ringX + "px," + ringY + "px,0) translate(-50%,-50%)";
      requestAnimationFrame(moveCursor);
    })();
  }

  /* ---------- 8. 导航锚点高亮（当前区块） ---------- */
  var navLinks = $$(".nav__links a");
  var sectionIds = ["about", "education", "skills", "projects", "works", "contact"];
  var sections = sectionIds
    .map(function (id) {
      return document.getElementById(id);
    })
    .filter(Boolean);

  if (navLinks.length && sections.length && "IntersectionObserver" in window) {
    var linkFor = function (id) {
      return $$('.nav__links a[href="#' + id + '"]')[0];
    };
    var activeObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navLinks.forEach(function (a) {
            a.classList.remove("is-active");
            a.removeAttribute("aria-current");
          });
          var link = linkFor(entry.target.id);
          if (link) {
            link.classList.add("is-active");
            link.setAttribute("aria-current", "true");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach(function (section) {
      activeObserver.observe(section);
    });
  }

  /* ===== 后续迭代交互在此追加 ===== */
})();
