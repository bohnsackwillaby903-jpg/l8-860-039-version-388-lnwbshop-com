(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
      }[char];
    });
  }

  function setupMenu() {
    var button = qs('[data-menu-toggle]');
    var panel = qs('[data-mobile-menu]');
    if (!button || !panel) {
      return;
    }
    button.addEventListener('click', function () {
      panel.classList.toggle('is-open');
    });
  }

  function setupHero() {
    var slides = qsa('[data-hero-slide]');
    var dots = qsa('[data-hero-dot]');
    var prev = qs('[data-hero-prev]');
    var next = qs('[data-hero-next]');
    if (!slides.length) {
      return;
    }
    var active = 0;
    var timer = null;

    function show(index) {
      active = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === active);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === active);
      });
    }

    function start() {
      clearInterval(timer);
      timer = setInterval(function () {
        show(active + 1);
      }, 5000);
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(active - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        show(active + 1);
        start();
      });
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        start();
      });
    });
    show(0);
    start();
  }

  function setupCardFilter() {
    var input = qs('[data-card-filter]');
    var cards = qsa('[data-search-text]');
    if (!input || !cards.length) {
      return;
    }
    input.addEventListener('input', function () {
      var value = input.value.trim().toLowerCase();
      cards.forEach(function (card) {
        var text = (card.getAttribute('data-search-text') || '').toLowerCase();
        card.style.display = !value || text.indexOf(value) !== -1 ? '' : 'none';
      });
    });
  }

  function setupPlayer() {
    var video = qs('[data-video]');
    var overlay = qs('[data-play-overlay]');
    if (!video) {
      return;
    }
    var playUrl = video.getAttribute('data-video');
    var bound = false;
    var hlsInstance = null;

    function bindVideo() {
      if (bound || !playUrl) {
        return;
      }
      bound = true;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = playUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls();
        hlsInstance.loadSource(playUrl);
        hlsInstance.attachMedia(video);
      } else {
        video.src = playUrl;
      }
    }

    function playVideo() {
      bindVideo();
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
      var result = video.play();
      if (result && typeof result.catch === 'function') {
        result.catch(function () {});
      }
    }

    if (overlay) {
      overlay.addEventListener('click', playVideo);
    }
    video.addEventListener('click', function () {
      if (video.paused) {
        playVideo();
      }
    });
    video.addEventListener('play', function () {
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
    });
    window.addEventListener('beforeunload', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }

  function buildSearchCard(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');
    return [
      '<article class="movie-card">',
      '<a class="movie-cover" href="' + escapeHtml(movie.file) + '">',
      '<img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
      '<span class="movie-type">' + escapeHtml(movie.type) + '</span>',
      '<span class="cover-play">▶</span>',
      '</a>',
      '<div class="movie-card-body">',
      '<h3><a href="' + escapeHtml(movie.file) + '">' + escapeHtml(movie.title) + '</a></h3>',
      '<p class="movie-meta">' + escapeHtml(movie.year) + ' · ' + escapeHtml(movie.region) + ' · ' + escapeHtml(movie.genre) + '</p>',
      '<p class="movie-line">' + escapeHtml(movie.oneLine) + '</p>',
      '<div class="tag-row">' + tags + '</div>',
      '</div>',
      '</article>'
    ].join('');
  }

  function setupSearchPage() {
    var input = qs('[data-search-input]');
    var results = qs('[data-search-results]');
    var state = qs('[data-search-state]');
    var empty = qs('[data-search-empty]');
    if (!input || !results || !window.SEARCH_INDEX) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var initial = params.get('q') || '';
    input.value = initial;

    function render() {
      var query = input.value.trim().toLowerCase();
      var list = window.SEARCH_INDEX.filter(function (movie) {
        var text = [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.tags.join(' '), movie.oneLine].join(' ').toLowerCase();
        return !query || text.indexOf(query) !== -1;
      }).slice(0, 80);
      results.innerHTML = list.map(buildSearchCard).join('');
      if (state) {
        state.textContent = query ? '与“' + input.value.trim() + '”相关的片库内容' : '输入关键词查找片名、地区、类型和标签';
      }
      if (empty) {
        empty.classList.toggle('is-visible', list.length === 0);
      }
    }

    input.addEventListener('input', render);
    render();
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMenu();
    setupHero();
    setupCardFilter();
    setupPlayer();
    setupSearchPage();
  });
})();
