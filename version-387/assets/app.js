(function() {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  ready(function() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var nav = document.querySelector("[data-mobile-nav]");
    if (toggle && nav) {
      toggle.addEventListener("click", function() {
        nav.classList.toggle("is-open");
      });
    }

    var hero = document.querySelector("[data-hero]");
    if (hero) {
      var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
      var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
      var index = 0;
      var timer = null;

      function show(nextIndex) {
        if (!slides.length) {
          return;
        }
        index = (nextIndex + slides.length) % slides.length;
        slides.forEach(function(slide, slideIndex) {
          slide.classList.toggle("is-active", slideIndex === index);
        });
        dots.forEach(function(dot, dotIndex) {
          dot.classList.toggle("is-active", dotIndex === index);
        });
      }

      function start() {
        stop();
        timer = window.setInterval(function() {
          show(index + 1);
        }, 5200);
      }

      function stop() {
        if (timer) {
          window.clearInterval(timer);
          timer = null;
        }
      }

      dots.forEach(function(dot, dotIndex) {
        dot.addEventListener("click", function() {
          show(dotIndex);
          start();
        });
      });

      hero.addEventListener("mouseenter", stop);
      hero.addEventListener("mouseleave", start);
      start();
    }

    var searchForms = document.querySelectorAll("[data-search-form]");
    searchForms.forEach(function(form) {
      form.addEventListener("submit", function(event) {
        var input = form.querySelector("input[name='q']");
        if (!input || !input.value.trim()) {
          return;
        }
        event.preventDefault();
        window.location.href = "search.html?q=" + encodeURIComponent(input.value.trim());
      });
    });

    var panel = document.querySelector("[data-filter-panel]");
    if (panel) {
      var input = panel.querySelector("[data-filter-input]");
      var selects = Array.prototype.slice.call(panel.querySelectorAll("[data-filter-field]"));
      var status = panel.querySelector("[data-filter-status]");
      var cards = Array.prototype.slice.call(document.querySelectorAll("[data-filter-card]"));
      var params = new URLSearchParams(window.location.search);
      var initialQuery = params.get("q") || "";

      if (input && initialQuery) {
        input.value = initialQuery;
      }

      function normalize(value) {
        return String(value || "").toLowerCase().replace(/\s+/g, "");
      }

      function applyFilters() {
        var query = normalize(input ? input.value : "");
        var active = {};
        selects.forEach(function(select) {
          active[select.getAttribute("data-filter-field")] = normalize(select.value);
        });
        var visible = 0;

        cards.forEach(function(card) {
          var text = normalize(card.getAttribute("data-search") || card.textContent);
          var matched = !query || text.indexOf(query) !== -1;
          Object.keys(active).forEach(function(field) {
            var expected = active[field];
            if (expected) {
              var current = normalize(card.getAttribute("data-" + field));
              if (current.indexOf(expected) === -1) {
                matched = false;
              }
            }
          });
          card.classList.toggle("is-hidden", !matched);
          if (matched) {
            visible += 1;
          }
        });

        if (status) {
          status.textContent = visible ? "" : "没有匹配到相关内容";
        }
      }

      if (input) {
        input.addEventListener("input", applyFilters);
      }
      selects.forEach(function(select) {
        select.addEventListener("change", applyFilters);
      });
      applyFilters();
    }
  });

  window.setupMoviePlayer = function(streamUrl) {
    var video = document.getElementById("movie-player");
    var button = document.getElementById("movie-play");
    var cover = document.querySelector("[data-player-cover]");
    var hls = null;
    var attached = false;

    if (!video || !button || !cover || !streamUrl) {
      return;
    }

    function attach() {
      if (attached) {
        return;
      }
      attached = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
      } else {
        video.src = streamUrl;
      }
    }

    function startPlayback() {
      attach();
      cover.classList.add("is-hidden");
      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function() {});
      }
    }

    button.addEventListener("click", startPlayback);
    cover.addEventListener("click", startPlayback);
    video.addEventListener("click", function() {
      if (video.paused) {
        startPlayback();
      }
    });
    window.addEventListener("pagehide", function() {
      if (hls) {
        hls.destroy();
      }
    });
  };
})();
