// ── Holodeck 3D grid (Three.js) ───────────────────────────────────────────────
//
// Progressive enhancement of the CSS `#education::before` fallback grid.
//
// Design notes:
//   - Lazy-loaded via IntersectionObserver: Three.js (~200KB gzip) is only
//     fetched when the visitor scrolls near #education. Visitors who bounce
//     from the hero pay nothing. This matches web.dev's "reduce unused
//     JavaScript" guidance.
//   - Gated on prefers-reduced-motion (WCAG 2.3.3) and viewport width.
//     Below 768px the mobile GPU / battery tradeoff isn't worth it; the
//     CSS grid still reads as "holodeck-ish" on small screens.
//   - Theme-aware: reads --bg and --accent from CSS custom properties,
//     re-reads them when [data-theme] changes.
//   - Frame loop pauses when the section scrolls out of view (saves battery
//     on visitors who scroll past and don't come back).
//
// If any of the above fails, the CSS ::before grid stays visible.
// The upgrade is silent-fail by design.

(function () {
    var section = document.getElementById('education');
    if (!section) return;

    // Skip if the visitor has asked the OS for reduced motion.
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Skip on narrow viewports — mobile GPU cost isn't worth the visual gain,
    // and the CSS fallback already carries the theme.
    if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) return;

    var THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    var loaded = false;

    function loadThree() {
        return new Promise(function (resolve, reject) {
            if (window.THREE) return resolve(window.THREE);
            var s = document.createElement('script');
            s.src = THREE_URL;
            s.async = true;
            s.onload = function () { resolve(window.THREE); };
            s.onerror = function () { reject(new Error('Failed to load Three.js')); };
            document.head.appendChild(s);
        });
    }

    // Read a CSS custom property from :root and coerce it into a hex the
    // THREE.Color parser accepts. Strips whitespace.
    function readColor(name, fallback) {
        var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return v || fallback;
    }

    function initHolodeck(THREE) {
        var canvas = document.getElementById('holodeck-canvas');
        if (!canvas) return;

        var renderer;
        try {
            renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                alpha: true,
                antialias: true
            });
        } catch (e) {
            // No WebGL support — CSS fallback stays.
            return;
        }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

        var scene = new THREE.Scene();

        // Fog fades the grid into the background near the horizon. Fog color
        // matches --bg so the grid appears to dissolve into the page rather
        // than terminate at a visible edge.
        var bgHex = readColor('--bg', '#0b0f17');
        scene.fog = new THREE.Fog(new THREE.Color(bgHex), 12, 55);

        // Grid: 400 units square, 80 divisions → 5-unit cells. Two colors so
        // the center lines subtly stand out, giving a sense of forward direction.
        var accentHex = readColor('--accent', '#2dd4bf');
        var gridColor = new THREE.Color(accentHex);
        var grid = new THREE.GridHelper(400, 80, gridColor, gridColor);
        // GridHelper uses LineBasicMaterial; make it react to fog and set opacity.
        grid.material.transparent = true;
        grid.material.opacity = 0.55;
        grid.material.fog = true;
        scene.add(grid);

        // Camera: low above the floor, tilted slightly forward — the classic
        // holodeck "you're standing on it" angle.
        var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
        camera.position.set(0, 2.4, 10);
        camera.lookAt(0, 0, -20);

        // Interactive tilt: mouse position within the section shifts the camera
        // by a small amount. Smoothed with lerp so it feels weighty, not twitchy.
        var mouseX = 0, mouseY = 0;
        var camOffsetX = 0, camOffsetY = 0;
        section.addEventListener('mousemove', function (e) {
            var r = section.getBoundingClientRect();
            mouseX = ((e.clientX - r.left) / r.width - 0.5) * 2;   // -1 .. 1
            mouseY = ((e.clientY - r.top)  / r.height - 0.5) * 2;
        });
        section.addEventListener('mouseleave', function () {
            mouseX = 0; mouseY = 0;
        });

        function resize() {
            var r = section.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) return;
            renderer.setSize(r.width, r.height, false);
            camera.aspect = r.width / r.height;
            camera.updateProjectionMatrix();
        }
        resize();

        // ResizeObserver catches the section growing when the education
        // expandable opens — window 'resize' alone would miss that.
        if (window.ResizeObserver) {
            var ro = new ResizeObserver(resize);
            ro.observe(section);
        } else {
            window.addEventListener('resize', resize);
        }

        // Theme change — re-read CSS variables and update the scene.
        var themeObserver = new MutationObserver(function () {
            var bg = new THREE.Color(readColor('--bg', '#0b0f17'));
            var ac = new THREE.Color(readColor('--accent', '#2dd4bf'));
            scene.fog.color.copy(bg);
            grid.material.color.copy(ac);
            // GridHelper stores per-vertex colors; refresh them.
            var colors = grid.geometry.attributes.color;
            if (colors) {
                for (var i = 0; i < colors.count; i++) {
                    colors.setXYZ(i, ac.r, ac.g, ac.b);
                }
                colors.needsUpdate = true;
            }
        });
        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });

        // Frame loop.
        var rafId = null;
        var lastT = performance.now();
        function tick(now) {
            var dt = (now - lastT) / 1000;
            lastT = now;

            // Drift grid forward for the Tron/holodeck moving-floor feel.
            // Modulo the cell size (5) so the shift is invisible — the grid
            // appears to scroll infinitely without ever teleporting.
            grid.position.z = (grid.position.z + dt * 3) % 5;

            // Smoothly ease camera toward mouse-driven target offsets.
            camOffsetX += (mouseX * 1.8 - camOffsetX) * 0.05;
            camOffsetY += (mouseY * 0.8 - camOffsetY) * 0.05;
            camera.position.x = camOffsetX;
            camera.position.y = 2.4 - camOffsetY;
            camera.lookAt(camOffsetX * 0.3, 0, -20);

            renderer.render(scene, camera);
            rafId = requestAnimationFrame(tick);
        }

        function play() { if (rafId === null) { lastT = performance.now(); rafId = requestAnimationFrame(tick); } }
        function pause() { if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; } }

        // Pause the loop when the section is out of view — saves battery
        // for visitors who scroll past and stay somewhere else.
        var visObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) play(); else pause();
            });
        }, { threshold: 0.01 });
        visObs.observe(section);

        // Reveal: swap the CSS grid for the canvas.
        section.classList.add('has-webgl');
        play();
    }

    // Lazy trigger: only kick off the CDN load when the visitor is within
    // 300px of the section. rootMargin gives the network request a head start
    // so the first frame lands close to when the visitor sees the container.
    var trigger = new IntersectionObserver(function (entries) {
        if (loaded) return;
        if (!entries[0].isIntersecting) return;
        loaded = true;
        trigger.disconnect();
        loadThree().then(initHolodeck).catch(function (err) {
            console.warn('[holodeck] fell back to CSS grid:', err);
        });
    }, { rootMargin: '300px 0px' });
    trigger.observe(section);
})();
