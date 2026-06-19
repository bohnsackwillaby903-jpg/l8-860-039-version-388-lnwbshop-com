(function () {
    function getCards(grid) {
        return Array.prototype.slice.call(grid.querySelectorAll('[data-card]'));
    }

    function normalize(value) {
        return String(value || '').toLowerCase().trim();
    }

    function setupMobileMenu() {
        var toggle = document.querySelector('[data-mobile-menu-toggle]');
        var menu = document.querySelector('[data-mobile-menu]');
        if (!toggle || !menu) {
            return;
        }
        toggle.addEventListener('click', function () {
            menu.classList.toggle('open');
        });
    }

    function setupHeroCarousel() {
        var root = document.querySelector('[data-hero-carousel]');
        if (!root) {
            return;
        }
        var slides = Array.prototype.slice.call(root.querySelectorAll('.hero-slide'));
        var dots = Array.prototype.slice.call(root.querySelectorAll('[data-hero-dot]'));
        var prev = root.querySelector('[data-hero-prev]');
        var next = root.querySelector('[data-hero-next]');
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            if (!slides.length) {
                return;
            }
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, current) {
                slide.classList.toggle('active', current === index);
            });
            dots.forEach(function (dot, current) {
                dot.classList.toggle('active', current === index);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
            }
        }

        if (prev) {
            prev.addEventListener('click', function () {
                show(index - 1);
                start();
            });
        }
        if (next) {
            next.addEventListener('click', function () {
                show(index + 1);
                start();
            });
        }
        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                show(Number(dot.getAttribute('data-hero-dot')) || 0);
                start();
            });
        });
        root.addEventListener('mouseenter', stop);
        root.addEventListener('mouseleave', start);
        show(0);
        start();
    }

    function filterGrid(input) {
        var selector = input.getAttribute('data-filter-target');
        var grid = selector ? document.querySelector(selector) : null;
        if (!grid) {
            return;
        }
        var query = normalize(input.value);
        var cards = getCards(grid);
        var visible = 0;
        cards.forEach(function (card) {
            var text = normalize([
                card.getAttribute('data-title'),
                card.getAttribute('data-year'),
                card.getAttribute('data-views'),
                card.getAttribute('data-rating'),
                card.getAttribute('data-region'),
                card.getAttribute('data-genre'),
                card.getAttribute('data-tags'),
                card.textContent
            ].join(' '));
            var matched = !query || text.indexOf(query) !== -1;
            card.classList.toggle('is-hidden', !matched);
            if (matched) {
                visible += 1;
            }
        });
        var count = document.querySelector('[data-result-count]');
        if (count) {
            count.textContent = '当前显示 ' + visible + ' 部影片';
        }
    }

    function setupFiltering() {
        var inputs = Array.prototype.slice.call(document.querySelectorAll('[data-filter-target]'));
        inputs.forEach(function (input) {
            input.addEventListener('input', function () {
                filterGrid(input);
            });
        });
    }

    function setupSorting() {
        var selects = Array.prototype.slice.call(document.querySelectorAll('[data-sort-cards]'));
        selects.forEach(function (select) {
            select.addEventListener('change', function () {
                var selector = select.getAttribute('data-sort-cards');
                var grid = selector ? document.querySelector(selector) : null;
                if (!grid) {
                    return;
                }
                var cards = getCards(grid);
                var mode = select.value;
                cards.sort(function (a, b) {
                    if (mode === 'year-desc') {
                        return Number(b.getAttribute('data-year')) - Number(a.getAttribute('data-year'));
                    }
                    if (mode === 'views-desc') {
                        return Number(b.getAttribute('data-views')) - Number(a.getAttribute('data-views'));
                    }
                    if (mode === 'rating-desc') {
                        return Number(b.getAttribute('data-rating')) - Number(a.getAttribute('data-rating'));
                    }
                    if (mode === 'title-asc') {
                        return String(a.getAttribute('data-title')).localeCompare(String(b.getAttribute('data-title')), 'zh-CN');
                    }
                    return 0;
                });
                cards.forEach(function (card) {
                    grid.appendChild(card);
                });
            });
        });
    }

    function setupPlayers() {
        var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-play-video]'));
        buttons.forEach(function (button) {
            button.addEventListener('click', function () {
                var shell = button.closest('.video-shell');
                var video = shell ? shell.querySelector('video[data-src]') : null;
                var status = document.querySelector('[data-player-status]');
                if (!video) {
                    return;
                }
                var source = video.getAttribute('data-src');
                button.classList.add('is-hidden');
                if (status) {
                    status.textContent = '正在加载播放源...';
                }
                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = source;
                    video.play().catch(function () {
                        if (status) {
                            status.textContent = '浏览器阻止了自动播放，请再次点击播放器播放。';
                        }
                    });
                    return;
                }
                if (window.Hls && window.Hls.isSupported()) {
                    var hls = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: false
                    });
                    hls.loadSource(source);
                    hls.attachMedia(video);
                    hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        if (status) {
                            status.textContent = '播放源加载完成。';
                        }
                        video.play().catch(function () {
                            if (status) {
                                status.textContent = '播放源已加载，请点击播放器继续播放。';
                            }
                        });
                    });
                    hls.on(window.Hls.Events.ERROR, function (event, data) {
                        if (status) {
                            status.textContent = data && data.fatal ? '播放源加载失败，请刷新后重试。' : '播放器正在尝试恢复。';
                        }
                        if (data && data.fatal) {
                            hls.destroy();
                        }
                    });
                    video._hlsInstance = hls;
                    return;
                }
                video.src = source;
                if (status) {
                    status.textContent = '当前浏览器可能不支持 HLS，请更换 Safari、Chrome、Edge 或启用 HLS 支持。';
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        setupMobileMenu();
        setupHeroCarousel();
        setupFiltering();
        setupSorting();
        setupPlayers();
    });
}());
