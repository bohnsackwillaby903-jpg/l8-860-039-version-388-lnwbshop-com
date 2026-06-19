(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function setupMenu() {
    var button = document.querySelector("[data-menu-button]");
    var menu = document.querySelector("[data-mobile-menu]");
    if (!button || !menu) {
      return;
    }
    button.addEventListener("click", function () {
      menu.hidden = !menu.hidden;
      button.classList.toggle("is-open", !menu.hidden);
    });
  }

  function setupSiteSearch() {
    var forms = document.querySelectorAll("[data-site-search]");
    forms.forEach(function (form) {
      form.addEventListener("submit", function (event) {
        var input = form.querySelector("input[name='q']");
        if (!input) {
          return;
        }
        var query = input.value.trim();
        if (!query) {
          event.preventDefault();
          window.location.href = "./search.html";
        }
      });
    });
  }

  function setupHero() {
    var slider = document.querySelector("[data-hero-slider]");
    if (!slider) {
      return;
    }
    var slides = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-dot]"));
    if (slides.length < 2) {
      return;
    }
    var current = 0;
    var timer = null;
    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === current);
      });
    }
    function start() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }
    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
        start();
      });
    });
    slider.addEventListener("mouseenter", function () {
      window.clearInterval(timer);
    });
    slider.addEventListener("mouseleave", start);
    start();
  }

  function normalize(value) {
    return String(value || "").toLowerCase();
  }

  function setupFilters() {
    var roots = document.querySelectorAll("[data-filter-root]");
    roots.forEach(function (root) {
      var parent = root.parentElement || document;
      var input = root.querySelector("[data-filter-input]");
      var selects = Array.prototype.slice.call(root.querySelectorAll("[data-filter-select]"));
      var cards = Array.prototype.slice.call(parent.querySelectorAll("[data-movie-card]"));
      var empty = parent.querySelector("[data-empty-state]");
      var params = new URLSearchParams(window.location.search);
      var query = params.get("q") || "";
      if (input && query) {
        input.value = query;
      }
      function apply() {
        var text = normalize(input ? input.value : "");
        var visible = 0;
        cards.forEach(function (card) {
          var haystack = normalize([
            card.getAttribute("data-title"),
            card.getAttribute("data-region"),
            card.getAttribute("data-type"),
            card.getAttribute("data-year"),
            card.getAttribute("data-tags")
          ].join(" "));
          var pass = !text || haystack.indexOf(text) !== -1;
          selects.forEach(function (select) {
            var field = select.getAttribute("data-filter-select");
            var selected = normalize(select.value);
            var value = normalize(card.getAttribute("data-" + field));
            if (selected && value.indexOf(selected) === -1) {
              pass = false;
            }
          });
          card.hidden = !pass;
          if (pass) {
            visible += 1;
          }
        });
        if (empty) {
          empty.hidden = visible !== 0;
        }
      }
      if (input) {
        input.addEventListener("input", apply);
      }
      selects.forEach(function (select) {
        select.addEventListener("change", apply);
      });
      apply();
    });
  }

  window.CinemaPlayer = {
    init: function (mediaUrl) {
      var video = document.querySelector("[data-player-video]");
      var layer = document.querySelector("[data-play-layer]");
      var button = document.querySelector("[data-play-button]");
      if (!video || !mediaUrl) {
        return;
      }
      var attached = false;
      var hlsInstance = null;
      function attachMedia() {
        if (attached) {
          return;
        }
        attached = true;
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = mediaUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hlsInstance.loadSource(mediaUrl);
          hlsInstance.attachMedia(video);
        } else {
          video.src = mediaUrl;
        }
      }
      function playMovie() {
        attachMedia();
        if (layer) {
          layer.classList.add("is-hidden");
        }
        var result = video.play();
        if (result && typeof result.catch === "function") {
          result.catch(function () {});
        }
      }
      if (button) {
        button.addEventListener("click", playMovie);
      }
      if (layer) {
        layer.addEventListener("click", playMovie);
      }
      video.addEventListener("click", function () {
        if (video.paused) {
          playMovie();
        }
      });
      video.addEventListener("play", function () {
        if (layer) {
          layer.classList.add("is-hidden");
        }
      });
      video.addEventListener("ended", function () {
        if (layer) {
          layer.classList.remove("is-hidden");
        }
      });
      window.addEventListener("pagehide", function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    }
  };

  ready(function () {
    setupMenu();
    setupSiteSearch();
    setupHero();
    setupFilters();
  });
})();
