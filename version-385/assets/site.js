(function () {
  function toggleMenu() {
    var button = document.querySelector('[data-menu-button]');
    var nav = document.querySelector('[data-nav-links]');
    if (!button || !nav) {
      return;
    }
    button.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
  }

  function setupHero() {
    var slider = document.querySelector('[data-hero-slider]');
    if (!slider) {
      return;
    }
    var slides = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-dot]'));
    if (slides.length < 2) {
      return;
    }
    var current = 0;
    var timer = null;
    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === current);
      });
    }
    function start() {
      clearInterval(timer);
      timer = setInterval(function () {
        show(current + 1);
      }, 5200);
    }
    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
        start();
      });
    });
    show(0);
    start();
  }

  function setupFilters() {
    var panel = document.querySelector('[data-filter-panel]');
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-filter-card]'));
    if (!panel || !cards.length) {
      return;
    }
    var keyword = panel.querySelector('[data-filter-keyword]');
    var region = panel.querySelector('[data-filter-region]');
    var type = panel.querySelector('[data-filter-type]');
    var year = panel.querySelector('[data-filter-year]');
    var empty = document.querySelector('[data-empty-state]');
    function valueOf(input) {
      return input ? input.value.trim().toLowerCase() : '';
    }
    function apply() {
      var q = valueOf(keyword);
      var r = valueOf(region);
      var t = valueOf(type);
      var y = valueOf(year);
      var visible = 0;
      cards.forEach(function (card) {
        var haystack = [
          card.getAttribute('data-title'),
          card.getAttribute('data-region'),
          card.getAttribute('data-type'),
          card.getAttribute('data-year'),
          card.getAttribute('data-genre'),
          card.getAttribute('data-tags')
        ].join(' ').toLowerCase();
        var ok = true;
        if (q && haystack.indexOf(q) === -1) {
          ok = false;
        }
        if (r && (card.getAttribute('data-region') || '').toLowerCase().indexOf(r) === -1) {
          ok = false;
        }
        if (t && (card.getAttribute('data-type') || '').toLowerCase().indexOf(t) === -1) {
          ok = false;
        }
        if (y && (card.getAttribute('data-year') || '').toLowerCase() !== y) {
          ok = false;
        }
        card.style.display = ok ? '' : 'none';
        if (ok) {
          visible += 1;
        }
      });
      if (empty) {
        empty.classList.toggle('is-visible', visible === 0);
      }
    }
    [keyword, region, type, year].forEach(function (input) {
      if (input) {
        input.addEventListener('input', apply);
        input.addEventListener('change', apply);
      }
    });
    apply();
  }

  function setupPlayer() {
    var video = document.querySelector('[data-video-player]');
    if (!video) {
      return;
    }
    var trigger = document.querySelector('[data-play-trigger]');
    var stream = video.getAttribute('src') || '';
    var ready = false;
    function prepare() {
      if (ready || !stream) {
        return;
      }
      ready = true;
      var nativeHls = video.canPlayType('application/vnd.apple.mpegurl') || video.canPlayType('application/x-mpegURL');
      if (!nativeHls && window.Hls && window.Hls.isSupported()) {
        video.removeAttribute('src');
        video.load();
        var hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(stream);
        hls.attachMedia(video);
      }
    }
    function play() {
      prepare();
      if (trigger) {
        trigger.classList.add('is-hidden');
      }
      var result = video.play();
      if (result && typeof result.catch === 'function') {
        result.catch(function () {});
      }
    }
    video.addEventListener('click', prepare);
    video.addEventListener('play', function () {
      if (trigger) {
        trigger.classList.add('is-hidden');
      }
    });
    if (trigger) {
      trigger.addEventListener('click', play);
    }
    prepare();
  }

  document.addEventListener('DOMContentLoaded', function () {
    toggleMenu();
    setupHero();
    setupFilters();
    setupPlayer();
  });
})();
