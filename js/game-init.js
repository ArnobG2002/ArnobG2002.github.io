var gameLoaded     = false;
var scene1         = null;
var gameIntervalId = null;

// p5.js calls setup() automatically — used only to attach the canvas.
function setup() {
    var canvas = document.getElementById('myCanvas');
    if (!canvas) return;
    createCanvas(canvas.width, canvas.height, canvas);
}

function initGame() {
    if (gameLoaded) return;
    gameLoaded = true;
    try {
        scene1 = new Scene();
        scene1.init();
        gameIntervalId = setInterval(function () {
            scene1.update();
            if (scene1.gameComplete) {
                clearInterval(gameIntervalId);
                gameIntervalId = null;
                document.querySelector('.game-keys').innerHTML = '';
            }
        }, 1000 / 60);
    } catch (err) {
        console.warn('Game failed to start:', err);
    }
}

document.getElementById('gameToggle').addEventListener('click', function () {
    var wrap = document.getElementById('gameWrap');
    if (wrap.classList.contains('game-hidden')) {
        wrap.classList.remove('game-hidden');
        this.textContent = '⏸ Hide game';
        initGame();
    } else {
        wrap.classList.add('game-hidden');
        this.textContent = '▶ Load game';
    }
});

document.getElementById('aiToggle').addEventListener('click', function () {
    if (!scene1 || scene1.gameComplete) return;
    scene1.aiMode = !scene1.aiMode;
    if (!scene1.aiMode) {
        scene1.player.right = false;
        scene1.player.left  = false;
        scene1.player.up    = false;
    }
    this.textContent = scene1.aiMode ? '🤖 AI: ON' : '🤖 Auto-break';
});
