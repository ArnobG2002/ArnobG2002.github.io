// ── Video loop fallback ───────────────────────────────────────────────────────
var milton = document.getElementById('milton');
if (milton) {
    setInterval(function () {
        try { milton.play(); } catch (e) {}
    }, 65000);
}

// ── Reveal on scroll ──────────────────────────────────────────────────────────
var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
        if (entry.isIntersecting) {
            entry.target.classList.add('in');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(function (el) { revealObserver.observe(el); });

// ── Footer year ───────────────────────────────────────────────────────────────
document.getElementById('year').textContent = new Date().getFullYear();

// ── Hamburger nav ─────────────────────────────────────────────────────────────
(function () {
    var nav    = document.getElementById('siteNav');
    var burger = document.getElementById('navBurger');
    var links  = document.getElementById('navLinks');
    if (!burger || !nav) return;

    function setOpen(open) {
        nav.classList.toggle('open', open);
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        burger.setAttribute('aria-label',    open ? 'Close menu' : 'Open menu');
    }
    burger.addEventListener('click', function (e) {
        e.stopPropagation();
        setOpen(!nav.classList.contains('open'));
    });
    links.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function () { setOpen(false); });
    });
    document.addEventListener('click', function (e) {
        if (nav.classList.contains('open') && !nav.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && nav.classList.contains('open')) setOpen(false);
    });
})();

// ── Education expandable ──────────────────────────────────────────────────────
(function () {
    var trigger = document.getElementById('schoolTrigger');
    var story   = document.getElementById('schoolStory');
    if (!trigger || !story) return;
    trigger.addEventListener('click', function () {
        var isOpen = story.classList.toggle('open');
        trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        story.setAttribute('aria-hidden',     isOpen ? 'false' : 'true');
        if (isOpen) {
            setTimeout(function () {
                trigger.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
        }
    });
})();

// ── Random hero portrait ──────────────────────────────────────────────────────
(function () {
    var portraits = ['DSC_0027.JPG', 'DSC_0030.JPG', '20230207_181747.jpg', '6_n.jpg'];
    var img = document.querySelector('.hero-portrait img');
    if (img) {
        img.src = portraits[Math.floor(Math.random() * portraits.length)];
    }
})();

// ── Carousel ─────────────────────────────────────────────────────────────────
document.querySelectorAll('[data-carousel]').forEach(function (carousel) {
    var slides  = carousel.querySelectorAll('.carousel-slide');
    var dots    = carousel.querySelectorAll('.carousel-dots button');
    var caption = carousel.querySelector('.carousel-caption');
    var current = 0;

    function go(idx) {
        idx = (idx + slides.length) % slides.length;
        slides.forEach(function (s, i) { s.classList.toggle('active', i === idx); });
        dots.forEach(function (d, i)   { d.classList.toggle('active', i === idx); });
        if (caption) caption.textContent = slides[idx].getAttribute('data-caption') || '';
        current = idx;
    }

    carousel.querySelector('.carousel-next').addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation(); go(current + 1);
    });
    carousel.querySelector('.carousel-prev').addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation(); go(current - 1);
    });
    dots.forEach(function (dot, i) {
        dot.addEventListener('click', function (e) {
            e.preventDefault(); e.stopPropagation(); go(i);
        });
    });
    go(0);
});

// ── Lightbox ──────────────────────────────────────────────────────────────────
(function () {
    var box = document.createElement('div');
    box.className = 'lightbox';
    box.innerHTML =
        '<button class="lightbox-close" aria-label="Close">×</button>' +
        '<img alt="" />' +
        '<div class="lightbox-caption"></div>';
    document.body.appendChild(box);
    var bImg = box.querySelector('img');
    var bCap = box.querySelector('.lightbox-caption');

    function open(thumb) {
        var img = thumb.querySelector('img');
        if (!img) return;
        bImg.src = img.currentSrc || img.src;
        bImg.alt = img.alt || '';
        bCap.textContent = thumb.getAttribute('data-caption') || img.alt || '';
        box.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function close() {
        box.classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(function () { if (!box.classList.contains('open')) bImg.src = ''; }, 250);
    }

    document.addEventListener('click', function (e) {
        var thumb = e.target.closest('.proof-thumb');
        if (thumb) { e.preventDefault(); open(thumb); return; }
        var slide = e.target.closest('.carousel-slide');
        if (slide && slide.classList.contains('active') && e.target.tagName === 'IMG') {
            e.preventDefault(); open(slide); return;
        }
        if (e.target === box || e.target.closest('.lightbox-close')) close();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && box.classList.contains('open')) close();
    });
})();

// ── Scroll progress bar ───────────────────────────────────────────────────────
(function () {
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.prepend(bar);
    function update() {
        var doc = document.documentElement;
        var max = (doc.scrollHeight - window.innerHeight) || 1;
        bar.style.setProperty('--p', String(Math.min(1, Math.max(0, window.scrollY / max))));
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
})();

// ── Footer "now" line ─────────────────────────────────────────────────────────
(function () {
    var phrases = [
        "Currently exploring: holographic displays and their non-obvious defence applications.",
        "Currently reading: papers cited via Google Scholar, not Google.",
        "Currently building: a tool that turns roster screenshots into Google Calendar events.",
        "Currently learning: how to write OpenCV that actually generalizes.",
        "Currently shipping: small experiments that make complex data legible.",
        "Currently thinking about: the gap between extraction accuracy and decision quality.",
        "Currently rewatching: Star Trek: TNG, for reasons documented above."
    ];
    var el = document.getElementById('nowLine');
    if (!el) return;
    el.textContent = phrases[Math.floor(Math.random() * phrases.length)];
    requestAnimationFrame(function () { el.classList.add('in'); });
})();
