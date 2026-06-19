(function () {
  'use strict';

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function createFallbackSvg(title, meta) {
    var safeTitle = String(title || '精彩影片').slice(0, 18);
    var safeMeta = String(meta || '高清片库').slice(0, 28);
    var svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">',
      '<defs>',
      '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">',
      '<stop offset="0" stop-color="#111827"/>',
      '<stop offset="0.52" stop-color="#7c2d12"/>',
      '<stop offset="1" stop-color="#f97316"/>',
      '</linearGradient>',
      '<radialGradient id="r" cx="78%" cy="18%" r="60%">',
      '<stop offset="0" stop-color="rgba(255,255,255,0.42)"/>',
      '<stop offset="1" stop-color="rgba(255,255,255,0)"/>',
      '</radialGradient>',
      '</defs>',
      '<rect width="960" height="540" fill="url(#g)"/>',
      '<rect width="960" height="540" fill="url(#r)"/>',
      '<circle cx="780" cy="120" r="120" fill="rgba(255,255,255,0.08)"/>',
      '<rect x="72" y="76" width="816" height="388" rx="34" fill="rgba(0,0,0,0.22)" stroke="rgba(255,255,255,0.18)"/>',
      '<text x="96" y="248" fill="#ffffff" font-size="58" font-weight="800" font-family="Arial, Microsoft YaHei, sans-serif">' + escapeXml(safeTitle) + '</text>',
      '<text x="98" y="314" fill="#fed7aa" font-size="28" font-family="Arial, Microsoft YaHei, sans-serif">' + escapeXml(safeMeta) + '</text>',
      '<text x="98" y="382" fill="rgba(255,255,255,0.78)" font-size="24" font-family="Arial, Microsoft YaHei, sans-serif">国产剧集片库 · 高清在线观看</text>',
      '</svg>'
    ].join('');
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  function escapeXml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function fallbackImage(image) {
    if (!image || image.dataset.fallbackApplied === 'true') {
      return;
    }
    image.dataset.fallbackApplied = 'true';
    image.src = createFallbackSvg(image.dataset.fallbackTitle, image.dataset.fallbackMeta);
  }

  function setupImageFallbacks() {
    document.querySelectorAll('img[data-fallback-title]').forEach(function (image) {
      image.addEventListener('error', function () {
        fallbackImage(image);
      });

      if (image.complete && image.naturalWidth === 0) {
        fallbackImage(image);
      }
    });
  }

  function setupMobileMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var panel = document.querySelector('[data-mobile-panel]');

    if (!toggle || !panel) {
      return;
    }

    toggle.addEventListener('click', function () {
      panel.classList.toggle('is-open');
    });
  }

  function setupHero() {
    var hero = document.querySelector('[data-hero]');

    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var previous = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }

      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    function restart() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5000);
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
        restart();
      });
    });

    if (previous) {
      previous.addEventListener('click', function () {
        show(current - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        restart();
      });
    }

    restart();
  }

  function setupFilters() {
    var list = document.querySelector('[data-card-list]');
    var input = document.querySelector('[data-page-filter]');
    var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-type-filter]'));
    var count = document.querySelector('[data-filter-count]');
    var empty = document.querySelector('[data-empty-state]');

    if (!list) {
      return;
    }

    var cards = Array.prototype.slice.call(list.querySelectorAll('[data-movie-card]'));
    var activeType = 'all';

    function queryFromUrl() {
      var params = new URLSearchParams(window.location.search);
      return params.get('q') || '';
    }

    function applyFilter() {
      var keyword = normalize(input ? input.value : '');
      var visible = 0;

      cards.forEach(function (card) {
        var searchText = normalize(card.dataset.search);
        var typeText = normalize(card.dataset.type);
        var typeMatches = activeType === 'all' || typeText.indexOf(normalize(activeType)) !== -1 || searchText.indexOf(normalize(activeType)) !== -1;
        var keywordMatches = !keyword || searchText.indexOf(keyword) !== -1;
        var shouldShow = typeMatches && keywordMatches;

        card.hidden = !shouldShow;
        if (shouldShow) {
          visible += 1;
        }
      });

      if (count) {
        count.textContent = '当前显示 ' + visible + ' / ' + cards.length + ' 部影片';
      }

      if (empty) {
        empty.hidden = visible !== 0;
      }
    }

    if (input) {
      var initialQuery = queryFromUrl();
      if (initialQuery) {
        input.value = initialQuery;
      }
      input.addEventListener('input', applyFilter);
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        activeType = button.dataset.typeFilter || 'all';
        buttons.forEach(function (item) {
          item.classList.toggle('is-active', item === button);
        });
        applyFilter();
      });
    });

    applyFilter();
  }

  function loadExternalScript(src, callback) {
    var existing = document.querySelector('script[src="' + src + '"]');
    if (existing) {
      existing.addEventListener('load', callback);
      return;
    }

    var script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = callback;
    script.onerror = callback;
    document.head.appendChild(script);
  }

  function setupPlayer() {
    var video = document.querySelector('[data-video-player]');
    var button = document.querySelector('[data-play-button]');

    if (!video || !button) {
      return;
    }

    var source = video.dataset.videoSrc;
    var started = false;

    function playVideo() {
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {
          button.classList.remove('is-hidden');
        });
      }
    }

    function attachNative() {
      video.src = source;
      video.load();
      playVideo();
    }

    function attachHls() {
      if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: false
        });
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          playVideo();
        });
        return;
      }

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        attachNative();
        return;
      }

      attachNative();
    }

    function start() {
      button.classList.add('is-hidden');

      if (started) {
        playVideo();
        return;
      }

      started = true;

      if (window.Hls || video.canPlayType('application/vnd.apple.mpegurl')) {
        attachHls();
        return;
      }

      loadExternalScript('https://cdn.jsdelivr.net/npm/hls.js@1.5.18/dist/hls.min.js', attachHls);
    }

    button.addEventListener('click', start);
    video.addEventListener('play', function () {
      button.classList.add('is-hidden');
    });
    video.addEventListener('pause', function () {
      if (!video.ended) {
        button.classList.remove('is-hidden');
      }
    });
  }

  window.MovieSite = {
    fallbackImage: fallbackImage
  };

  document.addEventListener('DOMContentLoaded', function () {
    setupImageFallbacks();
    setupMobileMenu();
    setupHero();
    setupFilters();
    setupPlayer();
  });
}());
