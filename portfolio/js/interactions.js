/* interactions.js — заменяет рантайм Webflow (jQuery + webflow.js) для этой страницы.
   Воспроизводит: плавный скролл по якорям, переключение табов Webflow и
   скролл-анимацию появления карточек проектов (бывшая IX2-анимация "a-4"). */
(function () {
  "use strict";

  /* --- 1. Плавный скролл по внутренним ссылкам (заменяет smooth-scroll Webflow) --- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    // у табов нет href, сюда не попадут; обрабатываем только настоящие якоря и "#"
    e.preventDefault(); // как делал webflow.js — не даём странице прыгать и не пишем # в URL
    var href = a.getAttribute("href");
    if (href.length > 1) {
      var target = document.querySelector(href);
      if (target) {
        var y = target.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({ top: y, left: 0, behavior: "smooth" });
      }
    }
  });

  /* --- 2. Табы Webflow: переключение панелей + fade (заменяет w-tabs рантайма) --- */
  document.querySelectorAll(".w-tabs").forEach(function (tabs) {
    var links = tabs.querySelectorAll(".w-tab-link");
    var panes = tabs.querySelectorAll(".w-tab-pane");
    var durIn = parseInt(tabs.getAttribute("data-duration-in") || "300", 10);

    function activate(name) {
      links.forEach(function (l) {
        var on = l.getAttribute("data-w-tab") === name;
        l.classList.toggle("w--current", on);
        l.setAttribute("aria-selected", on ? "true" : "false");
      });
      panes.forEach(function (p) {
        var on = p.getAttribute("data-w-tab") === name;
        if (on) {
          if (!p.classList.contains("w--tab-active")) {
            p.classList.add("w--tab-active");
            p.style.opacity = "0";
            requestAnimationFrame(function () {
              p.style.transition = "opacity " + durIn + "ms ease";
              p.style.opacity = "1";
            });
          }
        } else {
          p.classList.remove("w--tab-active");
          p.style.opacity = "";
          p.style.transition = "";
        }
      });
    }

    links.forEach(function (l) {
      l.addEventListener("click", function (e) {
        e.preventDefault();
        activate(l.getAttribute("data-w-tab"));
      });
    });
  });

  /* --- 3. Скролл-фейд карточек проектов (заменяет IX2 "a-4": opacity 0→1) ---
     Оригинал: событие SCROLLING_IN_VIEW, keyframes 10%→20% прогресса въезда в вид. */
  var cards = Array.prototype.slice.call(
    document.querySelectorAll(".project-card[data-w-id]")
  );
  cards.forEach(function (c) { c.style.opacity = "0"; }); // начальное состояние как в IX2

  function updateCards() {
    var vh = window.innerHeight;
    cards.forEach(function (c) {
      var r = c.getBoundingClientRect();
      // прогресс "въезда в вид": 0 — верх у нижнего края экрана, 1 — ушёл за верх
      var p = (vh - r.top) / (vh + r.height);
      // окно keyframes 10%..20% -> непрозрачность 0..1
      var o = (p - 0.1) / 0.1;
      c.style.opacity = String(Math.max(0, Math.min(1, o)));
    });
  }

  window.addEventListener("scroll", updateCards, { passive: true });
  window.addEventListener("resize", updateCards);
  document.addEventListener("DOMContentLoaded", updateCards);
  updateCards();
})();
