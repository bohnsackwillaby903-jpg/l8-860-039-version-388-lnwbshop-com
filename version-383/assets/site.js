(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function setupMobileNav() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var mobileNav = document.querySelector('[data-mobile-nav]');

    if (!toggle || !mobileNav) {
      return;
    }

    toggle.addEventListener('click', function () {
      mobileNav.classList.toggle('is-open');
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
    var index = 0;
    var timer = null;

    function show(targetIndex) {
      if (!slides.length) {
        return;
      }

      index = (targetIndex + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function restart() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    if (previous) {
      previous.addEventListener('click', function () {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        restart();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        restart();
      });
    });

    show(0);
    restart();
  }

  function setupPageFilters() {
    var scopes = Array.prototype.slice.call(document.querySelectorAll('[data-filter-scope]'));

    scopes.forEach(function (scope) {
      var input = scope.querySelector('[data-filter-input]');
      var yearSelect = scope.querySelector('[data-filter-year]');
      var count = scope.querySelector('[data-filter-count]');
      var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-card]'));

      function applyFilter() {
        var keyword = normalize(input ? input.value : '');
        var year = normalize(yearSelect ? yearSelect.value : '');
        var visible = 0;

        cards.forEach(function (card) {
          var haystack = normalize([
            card.getAttribute('data-title'),
            card.getAttribute('data-genre'),
            card.getAttribute('data-region'),
            card.getAttribute('data-tags'),
            card.getAttribute('data-year')
          ].join(' '));
          var cardYear = normalize(card.getAttribute('data-year'));
          var matchesKeyword = !keyword || haystack.indexOf(keyword) !== -1;
          var matchesYear = !year || cardYear === year;
          var isVisible = matchesKeyword && matchesYear;

          card.classList.toggle('is-hidden', !isVisible);

          if (isVisible) {
            visible += 1;
          }
        });

        if (count) {
          count.textContent = visible + ' 部影片';
        }
      }

      if (input) {
        input.addEventListener('input', applyFilter);
      }

      if (yearSelect) {
        yearSelect.addEventListener('change', applyFilter);
      }
    });
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');

      if (existing) {
        if (window.Hls) {
          resolve();
        } else {
          existing.addEventListener('load', resolve, { once: true });
          existing.addEventListener('error', reject, { once: true });
        }
        return;
      }

      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function setupPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));

    players.forEach(function (player) {
      var video = player.querySelector('video');
      var trigger = player.querySelector('[data-play-trigger]');
      var status = player.querySelector('[data-player-status]');
      var src = player.getAttribute('data-src');
      var poster = player.getAttribute('data-poster');
      var initialized = false;
      var hlsInstance = null;

      function setStatus(message) {
        if (status) {
          status.textContent = message;
        }
      }

      function hideTrigger() {
        if (trigger) {
          trigger.classList.add('is-hidden');
        }
      }

      function initialize() {
        if (!video || !src) {
          setStatus('播放源不可用');
          return Promise.reject(new Error('Missing video or source'));
        }

        if (initialized) {
          return Promise.resolve();
        }

        initialized = true;
        setStatus('正在加载播放源');

        if (poster) {
          video.setAttribute('poster', poster);
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
          setStatus('已使用浏览器原生 HLS');
          return Promise.resolve();
        }

        return loadScript('https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js')
          .then(function () {
            if (window.Hls && window.Hls.isSupported()) {
              hlsInstance = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true
              });
              hlsInstance.loadSource(src);
              hlsInstance.attachMedia(video);
              hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                setStatus('播放源加载完成');
              });
              hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
                if (data && data.fatal) {
                  setStatus('播放加载失败，请刷新重试');
                }
              });
              return;
            }

            video.src = src;
            setStatus('已尝试使用直接播放模式');
          })
          .catch(function () {
            video.src = src;
            setStatus('HLS 组件加载失败，已尝试直接播放');
          });
      }

      function play() {
        initialize()
          .then(function () {
            hideTrigger();
            var playPromise = video.play();

            if (playPromise && typeof playPromise.catch === 'function') {
              playPromise.catch(function () {
                setStatus('浏览器阻止自动播放，请再次点击播放按钮');
              });
            }
          })
          .catch(function () {
            setStatus('播放器初始化失败');
          });
      }

      if (trigger) {
        trigger.addEventListener('click', play);
      }

      if (video) {
        video.addEventListener('play', function () {
          hideTrigger();
          setStatus('正在播放');
        });

        video.addEventListener('pause', function () {
          setStatus('已暂停');
        });

        video.addEventListener('error', function () {
          setStatus('视频播放出错');
        });
      }

      window.addEventListener('beforeunload', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  function createResultItem(movie) {
    var article = document.createElement('a');
    article.className = 'search-result-item';
    article.href = movie.url;

    article.innerHTML = [
      '<img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + ' 封面" loading="lazy">',
      '<div>',
      '<h3>' + escapeHtml(movie.title) + '</h3>',
      '<p>' + escapeHtml(movie.year + ' · ' + movie.region + ' · ' + movie.genre) + '</p>',
      '<p>' + escapeHtml(movie.oneLine || '') + '</p>',
      '</div>'
    ].join('');

    return article;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function setupGlobalSearch() {
    var input = document.getElementById('global-search-input');
    var button = document.getElementById('global-search-button');
    var results = document.getElementById('search-results');
    var movies = window.MOVIE_SEARCH_DATA || [];

    if (!input || !results) {
      return;
    }

    function render(query) {
      var keyword = normalize(query);
      var matched = movies.filter(function (movie) {
        var haystack = normalize([
          movie.title,
          movie.year,
          movie.region,
          movie.type,
          movie.genre,
          (movie.tags || []).join(' '),
          movie.oneLine
        ].join(' '));
        return keyword && haystack.indexOf(keyword) !== -1;
      }).slice(0, 80);

      results.innerHTML = '';

      if (!keyword) {
        results.innerHTML = '<p>请输入关键词开始搜索。</p>';
        return;
      }

      if (!matched.length) {
        results.innerHTML = '<p>没有找到匹配影片，请更换关键词。</p>';
        return;
      }

      var heading = document.createElement('div');
      heading.className = 'section-heading';
      heading.innerHTML = '<div><span class="eyebrow">Results</span><h2>找到 ' + matched.length + ' 条结果</h2></div>';

      var grid = document.createElement('div');
      grid.className = 'search-result-grid';

      matched.forEach(function (movie) {
        grid.appendChild(createResultItem(movie));
      });

      results.appendChild(heading);
      results.appendChild(grid);
    }

    function doSearch() {
      render(input.value);
    }

    input.addEventListener('input', doSearch);

    if (button) {
      button.addEventListener('click', doSearch);
    }

    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';

    if (query) {
      input.value = query;
      render(query);
    }
  }

  ready(function () {
    setupMobileNav();
    setupHero();
    setupPageFilters();
    setupPlayers();
    setupGlobalSearch();
  });
})();
