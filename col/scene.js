// https://forum.defold.com/t/tilesheet-uneven-tiles-sizes-solved/9613 citing megaman tilesheet
class Scene
{
    constructor()
    {
        this.ctx = document.getElementById("myCanvas").getContext("2d");

        this.entityManager = [];
        this.to_die        = [];
        this.currentFrame  = 0;

        // Physics utility — constructed once, reused every frame
        this.physics = new Physics();

        // Game-state flags
        this.gameComplete = false;
        this.aiMode       = false;
        this.aiCooldown   = 0;      // frames to idle between AI jumps
    }

    init()
    {
        // ── Preload all sprites once ──────────────────────────────────────────
        // Sprites whose <img> tags exist in the HTML (already fetched by the browser):
        this._imgStand     = document.getElementById('stand');
        this._imgGround    = document.getElementById('ground');
        this._imgBrick     = document.getElementById('brick');
        this._imgExplosion = document.getElementById('explosion');
        // air64 and run64 are NOT in the HTML preload block — load them here
        // so the browser fetches them before the player first moves/jumps,
        // preventing a one-frame flash of the wrong sprite on first use.
        this._imgAir = new Image();
        this._imgAir.src = "./col/megaman/air64.png";
        this._imgRun = new Image();
        this._imgRun.src = "./col/megaman/run64.png";

        // ── Ground tiles ──────────────────────────────────────────────────────
        // Cache the image reference once, outside the loop
        for (let i = 0; i < 20; i++) {
            let entity = new Entity("brown", [64 * i, 64 * 9, 64, 64]);
            entity.sprite = this._imgGround;
            this.entityManager.push(entity);
        }

        // ── Bricks — spell out "super ARNOB GHOSH" when intact ───────────────
        // Row 1 (y = 64*4): M · I · r o s.
        let e;
        e = new Entity('brown', [64 * 10,      64 * 4,    64, 64], 'M'); e.sprite = this._imgBrick; this.entityManager.push(e);
        e = new Entity('brown', [64 * 13 - 10, 64 * 4,    64, 64], 'I'); e.sprite = this._imgBrick; this.entityManager.push(e);
        let row1 = ['r', 'o', 's.'];
        for (let i = 0; i < row1.length; i++) {
            e = new Entity('brown', [64 * 16 + i * 64 - 18, 64 * 4, 64, 64], row1[i]);
            e.sprite = this._imgBrick;
            this.entityManager.push(e);
        }

        // Row 2 (y = 64*5.52): M · E · A M a n
        e = new Entity('brown', [64 * 9,  64 * 5.52, 64, 64], 'M'); e.sprite = this._imgBrick; this.entityManager.push(e);
        e = new Entity('brown', [64 * 10, 64 * 5.52, 64, 64], 'E'); e.sprite = this._imgBrick; this.entityManager.push(e);
        let row2 = ['A', 'M', 'a', 'n'];
        for (let i = 0; i < row2.length; i++) {
            e = new Entity('brown', [64 * 12 + i * 64, 64 * 5.52, 64, 64], row2[i]);
            e.sprite = this._imgBrick;
            this.entityManager.push(e);
        }

        // ── Player ───────────────────────────────────────────────────────────
        // Spawn mid-air at original height; fall begins on Load Game click
        this.player          = new Entity("rgb(60, 188, 252)", [64 * 2, 64 * 4, 50, 55]);
        this.player.state    = "jumping";
        this.player.sprite   = this._imgAir;
        this.player.canJump  = true;   // gates re-jump until W is released
        this.userInput();
        this.entityManager.push(this.player);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    getBrown()
    {
        return this.entityManager.filter(e => e.color === "brown");
    }

    /** Live (non-exploding) bricks that still have their texture label. */
    getBricks()
    {
        return this.entityManager.filter(
            e => e.color === 'brown' && e.hasCollision() &&
                 e.texture !== null  && e.texture !== undefined
        );
    }

    // ── Main loop ─────────────────────────────────────────────────────────────

    update()
    {
        if (this.gameComplete) return;   // canvas is now frozen still art

        this.deathUpdate();
        if (this.aiMode) this.aiUpdate();
        this.sMovement();
        this.sCollision();
        this.sRender();
        this.sAnimation();
        this.checkComplete();
    }

    // ── Game-completion detection ─────────────────────────────────────────────

    checkComplete()
    {
        if (this.gameComplete) return;

        const bricksLeft     = this.getBricks();
        const explosionsLeft = this.entityManager.filter(e => e.state === 'explosion');

        if (bricksLeft.length === 0 && explosionsLeft.length === 0) {
            this.gameComplete = true;
            // Disarm controls — Megaman stands still in the frozen still art
            this.player.right = false;
            this.player.left  = false;
            this.player.up    = false;
            this.aiMode       = false;
            // One final render so the frozen frame shows the fully-revealed name
            this.sRender();
        }
    }

    // ── Simple AI ─────────────────────────────────────────────────────────────

    /**
     * Each frame, pick the leftmost live brick, walk toward it, and jump
     * when aligned.  A cooldown prevents rapid re-jumping so Megaman has
     * time to land before the next attempt.
     */
    aiUpdate()
    {
        const targets = this.getBricks();

        if (targets.length === 0) {
            this.aiMode       = false;
            this.player.right = false;
            this.player.left  = false;
            this.player.up    = false;
            return;
        }

        // Sort left → right so we clear them in a readable sweep
        targets.sort((a, b) => a.rect[0] - b.rect[0]);
        const target = targets[0];
        const diff   = target.rect[0] - this.player.rect[0];

        if (this.aiCooldown > 0) {
            this.aiCooldown--;
            // Keep walking toward next target during the cooldown
            this.player.up    = false;
            this.player.right = diff > 8;
            this.player.left  = diff < -8;
            if (Math.abs(diff) <= 8) {
                this.player.right = false;
                this.player.left  = false;
            }
            return;
        }

        if (Math.abs(diff) > 8) {
            // Not yet aligned — walk toward the brick
            this.player.right = diff > 0;
            this.player.left  = diff < 0;
            this.player.up    = false;
        } else {
            // Aligned — jump!
            this.player.right = false;
            this.player.left  = false;
            if (this.player.state !== 'jumping') {
                this.player.up  = true;
                this.aiCooldown = 65;   // ~1 s at 60 fps — enough time to land
            } else {
                this.player.up = false;
            }
        }
    }

    // ── Systems ───────────────────────────────────────────────────────────────

    deathUpdate()
    {
        if (this.to_die.length === 0) return;
        // Use a Set for O(1) lookup; filter rebuilds the array without mutating
        // during iteration — avoids the for...in-on-array anti-pattern where
        // splice shifts indices and subsequent elements get skipped.
        const dying = new Set(this.to_die);
        this.entityManager = this.entityManager.filter(e => !dying.has(e));
        this.to_die = [];
    }

    sRender()
    {
        // Sky
        this.ctx.fillStyle = "rgb(100, 100, 255)";
        this.ctx.fillRect(0, 0, 1280, 640);

        this.ctx.fillStyle = "rgb(255, 255, 255)";

        // "super" only appears while at least one brick survives
        this.ctx.font = 34 + 'pt Arial';
        for (let i of this.entityManager) {
            if (i.sprite && i.sprite.id === "brick") {
                this.ctx.fillText("super", 64 * 11, 64 * 4);
                break;
            }
        }

        // Static name text — revealed fully once all bricks are gone
        this.ctx.font = 64 + 'pt Arial';
        this.ctx.fillText("ARNOB", 64 * 11, 64 * 5);
        this.ctx.fillText("GHOSH", 64 * 11, 64 * 6.5);

        // HUD — brick counter, top-left, only visible while bricks remain
        const brickCount = this.getBricks().length;
        if (brickCount > 0) {
            this.ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
            this.ctx.font      = "15pt Arial";
            this.ctx.fillText("Bricks: " + brickCount, 18, 32);
            if (this.aiMode) {
                this.ctx.fillStyle = "rgba(255, 220, 50, 0.90)";
                this.ctx.fillText("AI: ON", 18, 62);
            }
        }

        // Entities
        for (let i of this.entityManager) {
            if (i.sprite == null) {
                // Plain coloured rectangle
                this.ctx.fillStyle = i.color;
                this.ctx.fillRect(i.rect[0], i.rect[1], i.rect[2], i.rect[3]);
                this.ctx.strokeRect(i.rect[0], i.rect[1], i.rect[2], i.rect[3]);
                if (i.texture != null) {
                    this.ctx.fillStyle = "rgb(0, 0, 0)";
                    this.ctx.font      = 60 + 'pt Arial';
                    let tsize = this.ctx.measureText(i.texture).width / 2;
                    this.ctx.fillText(i.texture, i.rect[0] + 0.5 * i.rect[2] - tsize, i.rect[1] + i.rect[3]);
                }
            } else {
                if (i === this.player) {
                    this.ctx.save();
                    if (i.transform === -1) {
                        this.ctx.translate(i.rect[0] + i.rect[2], i.rect[1]);
                        this.ctx.scale(-1, 1);
                    } else {
                        this.ctx.translate(i.rect[0], i.rect[1]);
                    }
                    if (this.player.state === "standing" || this.player.state === "jumping") {
                        this.ctx.drawImage(i.sprite, 0, 0, 64, 64);
                    } else if (this.player.state === "running") {
                        this.ctx.drawImage(i.sprite, 64 * (Math.floor(this.currentFrame / 10) % 4), 0, 64, 64, 0, 0, 64, 64);
                    }
                    this.ctx.restore();
                } else if (i.state === "explosion") {
                    // Draw ONLY the explosion animation — not the underlying brick sprite.
                    // currentFrame is advanced in sAnimation (not here) to keep render pure.
                    if (i.currentFrame / 2 >= 6144 / 128) {
                        this.to_die.push(i);
                    } else {
                        this.ctx.drawImage(
                            i.sprite,
                            128 * Math.floor(i.currentFrame / 2), 0, 128, 128,
                            i.rect[0] - 32, i.rect[1] - 32, 128, 128
                        );
                    }
                } else {
                    this.ctx.drawImage(i.sprite, i.rect[0], i.rect[1], i.rect[2], i.rect[3]);
                    if (i.texture != null) {
                        this.ctx.fillStyle = "rgb(0, 0, 0)";
                        this.ctx.font      = 60 + 'pt Arial';
                        let tsize = this.ctx.measureText(i.texture).width / 2;
                        this.ctx.fillText(i.texture, i.rect[0] + 0.5 * i.rect[2] - tsize, i.rect[1] + 0.95 * i.rect[3]);
                    }
                }
            }
        }
    }

    sMovement()
    {
        // Variable-height jump: velocity is set on keydown; early keyup zeroes it
        // before gravity has fully bled it off → short hop.  Full hold → full arc.
        if (this.player.up && this.player.state !== "jumping") {
            this.player.velocity[1] = -20;
            this.player.state       = "jumping";
            this.player.up          = false;   // consume — sMovement fires once per press
        }
        if (this.player.right) {
            this.player.velocity[0] += 0.2;
            this.player.transform    = 1;
        } else if (this.player.left) {
            this.player.velocity[0] -= 0.2;
            this.player.transform    = -1;
        }
        if (this.player.velocity[0] >  5) this.player.velocity[0] =  5;
        if (this.player.velocity[0] < -5) this.player.velocity[0] = -5;
        if (!this.player.right && !this.player.left) this.player.velocity[0] = 0;

        this.player.prevRect     = [...this.player.rect];
        this.player.velocity[1] += 0.75;   // gravity

        for (let i of this.entityManager) {
            i.rect[0] += i.velocity[0];
            i.rect[1] += i.velocity[1];
        }
        if (this.player.rect[0] <  0)      this.player.rect[0] = 0;
        if (this.player.rect[0] > 19 * 64) this.player.rect[0] = 19 * 64;
    }

    sCollision()
    {
        this.player.state = "jumping";

        for (let t1 of this.getBrown()) {
            if (!t1.hasCollision()) continue;
            const ov  = this.physics.getOverlap(t1, this.player);
            const pov = this.physics.getPreviousOverlap(t1, this.player);

            if (ov[0] > 0 && ov[1] > 0) {
                if (pov[0] > 0) {
                    if (this.player.prevRect[1] < t1.rect[1]) {
                        // Landing on top of tile
                        this.player.rect[1] -= ov[1];
                        this.player.state    = this.player.velocity[0] === 0 ? 'standing' : 'running';
                    } else if (this.player.prevRect[1] > t1.rect[1]) {
                        // Hitting tile from below — smash it!
                        this.player.rect[1] += ov[1];
                        t1.state       = "explosion";
                        t1.sprite      = this._imgExplosion; // set now so sRender has the right sprite on frame 0
                        t1.collidable  = false;              // explicit flag replaces the rect.slice hack
                        t1.currentFrame = 0;
                        if (t1.texture) t1.texture = null;
                    }
                    this.player.velocity[1] = 0;
                } else if (pov[1] > 0) {
                    // Side collision
                    if (this.player.prevRect[0] < t1.rect[0]) {
                        this.player.rect[0] -= ov[0];
                    } else if (this.player.prevRect[0] > t1.rect[0]) {
                        this.player.rect[0] += ov[0];
                    }
                    this.player.velocity[0] *= -1;
                }
            }
        }
    }

    sAnimation()
    {
        // Swap the player sprite reference — no DOM queries, no src writes
        if (this.player.state === "standing") {
            this.player.sprite = this._imgStand;
            this.currentFrame  = 0;
        } else if (this.player.state === "jumping") {
            this.player.sprite = this._imgAir;
            this.currentFrame  = 0;
        } else if (this.player.state === "running") {
            this.player.sprite = this._imgRun;
            this.currentFrame += 1;
        }

        // Advance explosion frame counters here, not inside sRender,
        // so the render function only reads state and never writes it.
        for (let i of this.entityManager) {
            if (i.state === "explosion") {
                i.currentFrame += 1;
            }
        }
    }

    userInput()
    {
        window.addEventListener("keydown", (e) => {
            if (e.code === "KeyW") {
                // canJump blocks key-repeat and mid-air re-triggers (must release W first)
                if (this.player.canJump && this.player.state !== "jumping") {
                    this.player.up      = true;
                    this.player.canJump = false;
                }
            }
            if (e.code === "KeyD") this.player.right = true;
            if (e.code === "KeyA") this.player.left  = true;
        });
        window.addEventListener("keyup", (e) => {
            if (e.code === "KeyW") {
                // Still ascending on release → cut the jump short (short hop).
                // velocity[1] < 0 means moving upward (canvas y-axis is inverted).
                if (this.player.velocity[1] < 0) {
                    this.player.velocity[1] = 0;
                }
                this.player.canJump = true;
            }
            if (e.code === "KeyD") this.player.right = false;
            if (e.code === "KeyA") this.player.left  = false;
        });
    }
}
