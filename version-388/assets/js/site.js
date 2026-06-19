document.addEventListener('DOMContentLoaded', function () {
    var menuButton = document.querySelector('[data-menu-button]');
    var mobileNav = document.querySelector('[data-mobile-nav]');

    if (menuButton && mobileNav) {
        menuButton.addEventListener('click', function () {
            mobileNav.classList.toggle('open');
        });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
    var activeIndex = 0;

    function showSlide(index) {
        if (!slides.length) {
            return;
        }
        activeIndex = (index + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
            slide.classList.toggle('active', i === activeIndex);
        });
        dots.forEach(function (dot, i) {
            dot.classList.toggle('active', i === activeIndex);
        });
    }

    dots.forEach(function (dot) {
        dot.addEventListener('click', function () {
            showSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
        });
    });

    if (slides.length > 1) {
        setInterval(function () {
            showSlide(activeIndex + 1);
        }, 5200);
    }

    var panels = Array.prototype.slice.call(document.querySelectorAll('.filter-panel'));

    panels.forEach(function (panel) {
        var root = panel.parentElement;
        var list = root ? root.querySelector('[data-filter-list]') : null;
        var search = panel.querySelector('[data-filter-search]');
        var region = panel.querySelector('[data-filter-region]');
        var sort = panel.querySelector('[data-filter-sort]');

        if (!list) {
            return;
        }

        function getCards() {
            return Array.prototype.slice.call(list.querySelectorAll('.movie-card'));
        }

        function filterCards() {
            var query = search ? search.value.trim().toLowerCase() : '';
            var regionValue = region ? region.value.trim().toLowerCase() : '';
            var cards = getCards();

            cards.forEach(function (card) {
                var haystack = [
                    card.getAttribute('data-title'),
                    card.getAttribute('data-region'),
                    card.getAttribute('data-year'),
                    card.getAttribute('data-genre')
                ].join(' ').toLowerCase();
                var matchQuery = !query || haystack.indexOf(query) !== -1;
                var matchRegion = !regionValue || haystack.indexOf(regionValue) !== -1;
                card.classList.toggle('is-hidden', !(matchQuery && matchRegion));
            });
        }

        function sortCards() {
            var value = sort ? sort.value : 'default';
            var cards = getCards();

            if (value !== 'default') {
                cards.sort(function (a, b) {
                    var av = Number(a.getAttribute('data-' + value)) || 0;
                    var bv = Number(b.getAttribute('data-' + value)) || 0;
                    return bv - av;
                });
                cards.forEach(function (card) {
                    list.appendChild(card);
                });
            }
            filterCards();
        }

        if (search) {
            search.addEventListener('input', filterCards);
        }
        if (region) {
            region.addEventListener('change', filterCards);
        }
        if (sort) {
            sort.addEventListener('change', sortCards);
        }

        var params = new URLSearchParams(window.location.search);
        var q = params.get('q');
        if (q && search) {
            search.value = q;
            filterCards();
        }
    });
});
