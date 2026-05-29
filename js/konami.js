(function () {
    var seq = [
        'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
        'KeyB', 'KeyA'
    ];
    var pos = 0;

    function showToast(text) {
        var t = document.createElement('div');
        t.className = 'konami-toast';
        t.textContent = text;
        document.body.appendChild(t);
        requestAnimationFrame(function () { t.classList.add('show'); });
        setTimeout(function () { t.classList.remove('show'); }, 2200);
        setTimeout(function () { t.remove(); }, 2700);
    }

    function activate() {
        if (window.matchMedia('(max-width: 1280px)').matches) {
            showToast('↑↑↓↓←→←→BA — game needs a wider screen');
            return;
        }
        showToast('↑↑↓↓←→←→BA — game on');
        var wrap   = document.getElementById('gameWrap');
        var toggle = document.getElementById('gameToggle');
        if (wrap && toggle && wrap.classList.contains('game-hidden')) toggle.click();
        var section = document.getElementById('game');
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    document.addEventListener('keydown', function (e) {
        var tag = (e.target && e.target.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
        if (e.code === seq[pos]) {
            pos++;
            if (pos === seq.length) { activate(); pos = 0; }
        } else {
            pos = (e.code === seq[0]) ? 1 : 0;
        }
    });
})();
