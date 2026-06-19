function ready(fn) {
  if (document.readyState !== "loading") {
    fn();
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}

ready(function () {
  var toggle = document.querySelector("[data-menu-toggle]");
  var panel = document.querySelector("[data-mobile-panel]");

  if (toggle && panel) {
    toggle.addEventListener("click", function () {
      panel.classList.toggle("open");
      toggle.textContent = panel.classList.contains("open") ? "×" : "☰";
    });
  }

  var hero = document.querySelector("[data-hero-slider]");

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var current = 0;
    var timer;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === current);
      });
    }

    function restart() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(current - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
        restart();
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        show(index);
        restart();
      });
    });

    if (slides.length > 1) {
      restart();
    }
  }

  var roots = Array.prototype.slice.call(document.querySelectorAll("[data-filter-root]"));

  roots.forEach(function (root) {
    var input = root.querySelector("[data-filter-input]");
    var grid = document.querySelector("[data-filter-grid]");
    var buttons = Array.prototype.slice.call(root.querySelectorAll("[data-filter-value]"));
    var activeValue = "";

    if (!grid) {
      return;
    }

    var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-movie-card]"));
    var params = new URLSearchParams(window.location.search);
    var query = params.get("q") || "";

    if (input && query) {
      input.value = query;
    }

    function normalize(value) {
      return String(value || "").toLowerCase().trim();
    }

    function apply() {
      var term = normalize(input ? input.value : "");
      var filter = normalize(activeValue);

      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute("data-title"),
          card.getAttribute("data-year"),
          card.getAttribute("data-region"),
          card.getAttribute("data-tags")
        ].join(" "));
        var region = normalize(card.getAttribute("data-region"));
        var matchesText = !term || haystack.indexOf(term) !== -1;
        var matchesFilter = !filter || region === filter || haystack.indexOf(filter) !== -1;
        card.classList.toggle("hidden", !(matchesText && matchesFilter));
      });
    }

    if (input) {
      input.addEventListener("input", apply);
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        activeValue = button.getAttribute("data-filter-value") || "";
        buttons.forEach(function (item) {
          item.classList.toggle("active", item === button);
        });
        apply();
      });
    });

    apply();
  });
});

function initMoviePlayer(videoId, url) {
  var video = document.getElementById(videoId);
  var button = document.querySelector('[data-player-trigger="' + videoId + '"]');
  var hls = null;
  var started = false;

  if (!video || !url) {
    return;
  }

  function attach() {
    if (started) {
      return;
    }

    started = true;

    if (button) {
      button.classList.add("is-hidden");
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
    } else if (window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls({
        enableWorker: true,
        maxBufferLength: 30
      });
      hls.loadSource(url);
      hls.attachMedia(video);
    } else {
      video.src = url;
    }

    var playPromise = video.play();

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {});
    }
  }

  if (button) {
    button.addEventListener("click", attach);
  }

  video.addEventListener("click", function () {
    if (!started) {
      attach();
    }
  });

  window.addEventListener("pagehide", function () {
    if (hls) {
      hls.destroy();
      hls = null;
    }
  });
}
