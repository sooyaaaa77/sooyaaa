/* ============================================================
   个人作品集 · main.js（v0.3）
   原生 JavaScript，无第三方依赖。
   功能：主题切换 / 滚动进度条 / 章节导航吸顶高亮 / 进场动画
       移动端全屏菜单（含焦点陷阱）/ 数字滚动 / 页码年份
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
      themeBtn.setAttribute(
        "aria-label",
        theme === "dark" ? "切换到浅色主题" : "切换到深色主题"
      );
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", theme === "dark" ? "#121211" : "#ffffff");
    }
  }

  function readSavedTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch (e) {
      return null;
    }
  }

  /* 默认白底；只有用户主动切到深色并保存后才保持深色 */
  applyTheme(readSavedTheme() === "dark" ? "dark" : "light");

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

  /* ---------- 2. 滚动进度条 ---------- */
  var bar = $("#progress-bar");

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    if (bar) {
      bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
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
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );
    revealItems.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ---------- 4. 移动端全屏菜单（含焦点管理） ---------- */
  var menuBtn = $("#menu-btn");
  var mobileMenu = $("#mobile-menu");
  var menuClose = $("#menu-close");
  var menuLinks = mobileMenu ? $$("a", mobileMenu) : [];
  var menuFocusables = menuClose
    ? [menuClose].concat(menuLinks)
    : menuLinks.slice();

  function setMenu(open) {
    if (!menuBtn || !mobileMenu) return;

    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    document.body.classList.toggle("menu-open", open);

    if (open) {
      mobileMenu.hidden = false;
      mobileMenu.setAttribute("aria-hidden", "false");
      /* 下一帧再加类，让透明度过渡生效 */
      requestAnimationFrame(function () {
        mobileMenu.classList.add("is-open");
        if (menuClose) menuClose.focus();
      });
    } else {
      mobileMenu.classList.remove("is-open");
      mobileMenu.setAttribute("aria-hidden", "true");
      window.setTimeout(function () {
        if (menuBtn.getAttribute("aria-expanded") !== "true") {
          mobileMenu.hidden = true;
        }
      }, 260);
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

    if (menuClose) {
      menuClose.addEventListener("click", function () {
        setMenu(false);
        menuBtn.focus();
      });
    }

    document.addEventListener("keydown", function (e) {
      var open = menuBtn.getAttribute("aria-expanded") === "true";
      if (!open) return;

      if (e.key === "Escape") {
        setMenu(false);
        menuBtn.focus();
        return;
      }

      /* 焦点陷阱：Tab 只在菜单内的可聚焦元素之间循环 */
      if (e.key === "Tab" && menuFocusables.length) {
        var first = menuFocusables[0];
        var last = menuFocusables[menuFocusables.length - 1];
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
      /* 先归零，滚动到可见区域再计数；无 JS 时保留 HTML 里的最终数值 */
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

  /* ---------- 7. 章节导航锚点高亮（吸顶栏） ---------- */
  var navLinks = $$(".subnav__links a");
  var sectionIds = ["about", "education", "skills", "projects", "works", "contact"];
  var sections = sectionIds
    .map(function (id) {
      return document.getElementById(id);
    })
    .filter(Boolean);

  if (navLinks.length && sections.length && "IntersectionObserver" in window) {
    var linkFor = function (id) {
      return $$('.subnav__links a[href="#' + id + '"]')[0];
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
            /* 离开高亮带且暂无新区块进入时，取消高亮 */
            link.classList.remove("is-active");
            link.removeAttribute("aria-current");
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach(function (section) {
      activeObserver.observe(section);
    });
  }

  /* ---------- 8. 吸顶导航滑动指示块 ---------- */
  var subnav = $(".subnav");
  var subnavLinks = $(".subnav__links");
  var indicator = null;

  function updateIndicator() {
    if (!subnavLinks) return;
    if (!indicator) {
      indicator = document.createElement("span");
      indicator.className = "subnav__indicator";
      indicator.setAttribute("aria-hidden", "true");
      subnavLinks.insertBefore(indicator, subnavLinks.firstChild);
      subnavLinks.classList.add("has-indicator");
    }
    var active = subnavLinks.querySelector("a.is-active");
    if (!active) {
      indicator.style.opacity = "0";
      return;
    }
    indicator.style.opacity = "1";
    indicator.style.width = active.offsetWidth + "px";
    indicator.style.transform =
      "translate3d(" + active.offsetLeft + "px, -50%, 0)";
  }

  /* 吸顶状态：masthead 滚出视口后给 subnav 加阴影 */
  var masthead = $(".masthead");
  function updateStuck() {
    if (!subnav) return;
    var limit = masthead ? masthead.offsetHeight - 1 : 60;
    subnav.classList.toggle("is-stuck", window.scrollY > limit);
  }

  var rafId = null;
  window.addEventListener(
    "scroll",
    function () {
      if (rafId) return;
      rafId = window.requestAnimationFrame(function () {
        rafId = null;
        updateIndicator();
      });
    },
    { passive: true }
  );
  window.addEventListener("resize", updateIndicator);
  window.addEventListener("load", updateIndicator);
  updateIndicator();

  /* 高亮状态由 IntersectionObserver 异步添加，用 MutationObserver 保证指示块跟随 */
  if (window.MutationObserver && subnavLinks) {
    new MutationObserver(updateIndicator).observe(subnavLinks, {
      attributes: true,
      attributeFilter: ["class"],
      subtree: true,
    });
  }

  window.addEventListener("scroll", updateStuck, { passive: true });
  window.addEventListener("resize", updateStuck);
  updateStuck();

  /* ===== 后续迭代交互在此追加 ===== */
})();
