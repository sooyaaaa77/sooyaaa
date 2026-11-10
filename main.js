/* ============================================================
   个人作品集 · main.js
   原生 JavaScript，无第三方依赖。
   功能：主题切换 / 滚动进度条 / 导航状态 / 进场动画 / 移动菜单
       数字滚动 / 导航锚点高亮
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
      meta.setAttribute("content", theme === "dark" ? "#0f0f0f" : "#ffffff");
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
        /* 忽略存储失败（隐私模式等） */
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
  window.addEventListener("resize", onScroll);
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

  /* ---------- 4. 移动端全屏菜单（含焦点管理） ---------- */
  var menuBtn = $("#menu-btn");
  var mobileMenu = $("#mobile-menu");
  var menuLinks = mobileMenu ? $$("a", mobileMenu) : [];

  function setMenu(open) {
    if (!menuBtn || !mobileMenu) return;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    mobileMenu.setAttribute("aria-hidden", String(!open));
    mobileMenu.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    if (open && menuLinks.length) {
      menuLinks[0].focus();
    }
  }

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", function () {
      var willOpen = menuBtn.getAttribute("aria-expanded") !== "true";
      setMenu(willOpen);
      if (!willOpen) menuBtn.focus();
    });

    menuLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false);
      });
    });

    document.addEventListener("keydown", function (e) {
      var open = menuBtn.getAttribute("aria-expanded") === "true";
      if (!open) return;

      if (e.key === "Escape") {
        setMenu(false);
        menuBtn.focus();
        return;
      }

      /* 简单的焦点陷阱：Tab 只在菜单内循环 */
      if (e.key === "Tab" && menuLinks.length) {
        var first = menuLinks[0];
        var last = menuLinks[menuLinks.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
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

  /* ---------- 7. 导航锚点高亮（当前区块） ---------- */
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
          var link = linkFor(entry.target.id);
          if (entry.isIntersecting) {
            navLinks.forEach(function (a) {
              a.classList.remove("is-active");
              a.removeAttribute("aria-current");
            });
            if (link) {
              link.classList.add("is-active");
              link.setAttribute("aria-current", "true");
            }
          } else if (link && link.classList.contains("is-active")) {
            /* 区块离开高亮带但暂时没有新区块进入时，取消高亮 */
            link.classList.remove("is-active");
            link.removeAttribute("aria-current");
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
