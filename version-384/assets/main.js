(function () {
  var currentHeroIndex = 0;
  var heroTimer = null;

  function all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function showHero(index) {
    var slides = all('.hero-slide');
    var dots = all('.hero-dot');
    if (!slides.length) {
      return;
    }
    currentHeroIndex = (index + slides.length) % slides.length;
    slides.forEach(function (slide, itemIndex) {
      slide.classList.toggle('active', itemIndex === currentHeroIndex);
    });
    dots.forEach(function (dot, itemIndex) {
      dot.classList.toggle('active', itemIndex === currentHeroIndex);
    });
  }

  function startHero() {
    var slides = all('.hero-slide');
    if (slides.length < 2) {
      return;
    }
    var next = document.querySelector('.hero-next');
    var prev = document.querySelector('.hero-prev');
    var dots = all('.hero-dot');
    if (next) {
      next.addEventListener('click', function () {
        showHero(currentHeroIndex + 1);
      });
    }
    if (prev) {
      prev.addEventListener('click', function () {
        showHero(currentHeroIndex - 1);
      });
    }
    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        showHero(index);
      });
    });
    heroTimer = window.setInterval(function () {
      showHero(currentHeroIndex + 1);
    }, 5000);
    var hero = document.querySelector('.hero-carousel');
    if (hero) {
      hero.addEventListener('mouseenter', function () {
        window.clearInterval(heroTimer);
      });
      hero.addEventListener('mouseleave', function () {
        heroTimer = window.setInterval(function () {
          showHero(currentHeroIndex + 1);
        }, 5000);
      });
    }
  }

  function setupMenu() {
    var button = document.querySelector('.menu-toggle');
    var nav = document.querySelector('.mobile-nav');
    if (!button || !nav) {
      return;
    }
    button.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function normalize(text) {
    return String(text || '').toLowerCase().trim();
  }

  function setupFilters() {
    var panels = all('.filter-panel');
    panels.forEach(function (panel) {
      var section = panel.closest('.section-block') || document;
      var cards = all('.movie-card', section);
      var search = panel.querySelector('.movie-search');
      var selects = all('.filter-select', panel);
      var empty = section.querySelector('.empty-state');
      var params = new URLSearchParams(window.location.search);
      var query = params.get('q') || '';
      if (search && query) {
        search.value = query;
      }
      function apply() {
        var word = normalize(search ? search.value : '');
        var rules = {};
        selects.forEach(function (select) {
          rules[select.getAttribute('data-filter')] = normalize(select.value);
        });
        var visible = 0;
        cards.forEach(function (card) {
          var haystack = normalize([
            card.dataset.title,
            card.dataset.region,
            card.dataset.type,
            card.dataset.year,
            card.dataset.genre,
            card.dataset.tags
          ].join(' '));
          var matched = !word || haystack.indexOf(word) !== -1;
          Object.keys(rules).forEach(function (key) {
            if (rules[key] && normalize(card.dataset[key]) !== rules[key]) {
              matched = false;
            }
          });
          card.style.display = matched ? '' : 'none';
          if (matched) {
            visible += 1;
          }
        });
        if (empty) {
          empty.style.display = visible ? 'none' : 'block';
        }
      }
      if (search) {
        search.addEventListener('input', apply);
      }
      selects.forEach(function (select) {
        select.addEventListener('change', apply);
      });
      apply();
    });
  }

  function setupPlayer() {
    var video = document.querySelector('.video-player');
    var start = document.querySelector('.player-start');
    if (!video) {
      return;
    }
    var stream = video.getAttribute('data-stream');
    var ready = false;
    function bind() {
      if (ready || !stream) {
        return;
      }
      ready = true;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream;
      } else if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(stream);
        hls.attachMedia(video);
      } else {
        video.src = stream;
      }
    }
    function play() {
      bind();
      var attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(function () {});
      }
    }
    if (start) {
      start.addEventListener('click', function () {
        play();
      });
    }
    video.addEventListener('play', function () {
      if (start) {
        start.classList.add('is-hidden');
      }
    });
    video.addEventListener('pause', function () {
      if (start && video.currentTime === 0) {
        start.classList.remove('is-hidden');
      }
    });
    video.addEventListener('click', function () {
      bind();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMenu();
    startHero();
    setupFilters();
    setupPlayer();
  });
})();
