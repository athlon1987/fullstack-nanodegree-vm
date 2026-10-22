import './styles.css';
import { STEP } from './config';
import { AudioManager, MUSIC_BOSS, MUSIC_MENU } from './core/audio';
import { ACTION_LABELS, InputManager, KEY_ACTIONS, KEYS_P1, KEYS_P2, KEYS_SOLO, applyOverrides, keyLabel, type NavAction } from './core/input';
import { SaveManager, STAGE_COUNT, type CampaignSave, type KeyAction, type KeyOverrides, type Settings } from './core/save';
import { HEROES } from './data/heroes';
import { STAGES } from './data/stages';
import { ENDING, INTRO, hintText, type StoryPanel } from './data/story';
import type { DialogueLine, HeroId, HintId } from './data/types';
import { UPGRADES } from './data/upgrades';
import type { Enemy } from './game/enemy';
import { applyStageResult, levelFromXp, quoteUpgrade, buyUpgrade, totalPencils, type RunStats } from './game/progression';
import { World, type Checkpoint, type WorldListener } from './game/world';
import { drawHud } from './render/hud';
import { Renderer } from './render/renderer';
import { loadSprites, type CharSprite } from './render/sprites';
import { TouchControls } from './ui/touch';
import { UI, esc } from './ui/ui';

type Carry = { stats: RunStats; pencils: boolean[]; meter: number };

const ESSENTIAL_HINTS = new Set(['twins', 'finale', 'revive', 'out', 'plates']);

class App {
  readonly save = new SaveManager();
  readonly audio = new AudioManager();
  readonly input = new InputManager();
  readonly appEl = document.getElementById('app')!;
  readonly canvas = document.getElementById('game') as HTMLCanvasElement;
  readonly ui = new UI(document.getElementById('ui')!);
  readonly touch: TouchControls;
  renderer!: Renderer;
  sprites!: Record<HeroId, CharSprite>;
  world: World | null = null;
  stageIndex = 0;
  carry: Carry | null = null;
  paused = false;
  blockers = new Set<string>();
  frame = 0;
  private acc = 0;
  private last = 0;
  private dialogue: { lines: DialogueLine[]; i: number; shown: number; el: HTMLElement; done: () => void } | null = null;
  private frameTimes: number[] = [];
  private lowQuality = false;
  private touchMode = false;
  private menuTheme: 'meadow' | 'canyon' | 'city' | 'factory' | 'tower' = 'meadow';
  private pendingComplete = -1;

  constructor() {
    this.touch = new TouchControls(document.getElementById('touch')!, this.input, () => this.swapHero());
    this.ui.onSound = (k) => this.audio.play(k === 'move' ? 'uiMove' : k === 'back' ? 'uiBack' : 'uiSelect');
    this.applySettings();
  }

  get settings(): Settings {
    return this.save.data.settings;
  }

  get campaign(): CampaignSave | null {
    return this.save.data.campaign;
  }

  // ================================================================== boot
  async boot(): Promise<void> {
    this.ui.show(`<div class="card narrow" style="text-align:center"><h2>Opening the sketchbook…</h2><p>Loading Momo and Scout</p></div>`, {});
    try {
      const fontLoad = (document as Document & { fonts?: FontFaceSet }).fonts;
      await Promise.race([
        Promise.all([loadSprites().then((s) => (this.sprites = s)), fontLoad ? fontLoad.load('20px "Lilita One"').catch(() => null) : null]),
        new Promise((r) => setTimeout(r, 6000)),
      ]);
      if (!this.sprites) this.sprites = await loadSprites();
    } catch (e) {
      this.ui.show(`<div class="card narrow"><h2>Something went wrong</h2><p>The character drawings could not be loaded. Reload the page to try again.</p><p class="eyebrow">${esc(String(e))}</p></div>`, {});
      return;
    }
    this.renderer = new Renderer(this.canvas, this.sprites);
    this.bindGlobal();
    this.layout();
    requestAnimationFrame((t) => this.loop(t));
    this.showTitle();
  }

  private bindGlobal(): void {
    const relayout = () => this.layout();
    window.addEventListener('resize', relayout);
    window.addEventListener('orientationchange', () => setTimeout(relayout, 250));
    window.visualViewport?.addEventListener('resize', relayout);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.suspend();
      else this.resumeFromBackground();
    });
    window.addEventListener('blur', () => this.suspend());
    window.addEventListener('pagehide', () => this.suspend());
    window.addEventListener('gamepadconnected', () => {
      this.ui.toast('Gamepad connected');
      this.updateTouchVisibility();
    });
    // unlock audio on the first gesture
    const unlock = () => {
      this.audio.unlock();
      if (!this.world) this.audio.playMusic(MUSIC_MENU);
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
    // keep the page from scrolling / zooming while playing
    const block = (e: Event) => {
      if (this.appEl.classList.contains('playing') && !(e.target as HTMLElement).closest('.screen')) e.preventDefault();
    };
    document.addEventListener('touchmove', block, { passive: false });
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('dblclick', (e) => {
      if (this.appEl.classList.contains('playing')) e.preventDefault();
    });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => {
      if (this.dialogue && ['Enter', 'Space', 'KeyJ', 'KeyE', 'KeyC', 'NumpadEnter'].includes(e.code)) {
        e.preventDefault();
        this.advanceDialogue();
      }
    });
    this.input.onDeviceChange = (d) => {
      this.touchMode = d === 'touch' || this.touchMode;
      if (d === 'touch') this.touchMode = true;
      this.updateTouchVisibility();
    };
    this.touchMode = this.input.lastDevice === 'touch';
  }

  private suspend(): void {
    this.input.clear();
    this.touch.releaseAll();
    if (this.world && !this.paused && !this.world.complete && !this.world.gameOver) this.pause();
    if (document.hidden) this.audio.suspend();
  }

  private resumeFromBackground(): void {
    this.audio.resume();
    this.last = performance.now();
    this.acc = 0;
    this.layout();
  }

  // ================================================================== layout
  layout(): void {
    if (!this.renderer) return;
    const vv = window.visualViewport;
    const W = vv ? vv.width : window.innerWidth;
    const H = vv ? vv.height : window.innerHeight;
    const cs = getComputedStyle(document.documentElement);
    const inset = (n: string) => parseFloat(cs.getPropertyValue(n)) || 0;
    const sl = inset('--sal');
    const sr = inset('--sar');
    const st = inset('--sat');
    const sb = inset('--sab');
    const portrait = H > W;
    this.appEl.classList.toggle('portrait', portrait);
    let availW = W - sl - sr;
    let availH = H - st - sb;
    if (portrait) availH = Math.min(availH, availW * 0.9);
    else if (this.touchMode && this.world) {
      availW = W - Math.max(sl, 0) - Math.max(sr, 0);
    }
    const css = this.renderer.resize(Math.max(200, availW), Math.max(150, availH), window.devicePixelRatio || 1);
    // in portrait the controls live below the game view
    document.documentElement.style.setProperty('--below-game', `${Math.round(st + 8 + css.h + 10)}px`);
    if (this.world) this.world.camera.viewW = this.renderer.viewW;
    this.touch.scale = this.settings.touchScale;
    this.touch.layout();
    this.updateRotateHint();
  }

  private updateRotateHint(): void {
    const portrait = window.innerHeight > window.innerWidth;
    if (this.world && this.touchMode && portrait && !sessionStorageGet('rotateDismissed')) {
      const el = this.ui.overlay('rotate', `<span>Turn your phone sideways for a bigger view.</span><button class="btn small" data-dismiss>OK</button>`, 0, 'rotate-hint');
      el.querySelector('[data-dismiss]')?.addEventListener('click', () => {
        sessionStorageSet('rotateDismissed', '1');
        this.ui.clearOverlay('rotate');
      });
    } else this.ui.clearOverlay('rotate');
  }

  private updateTouchVisibility(): void {
    const show = !!this.world && this.touchMode && !this.paused;
    (document.getElementById('touch') as HTMLElement).hidden = !show;
  }

  private applySettings(): void {
    const s = this.settings;
    this.audio.setVolumes(s.music, s.sfx);
    document.documentElement.style.setProperty('--touch-scale', String(s.touchScale));
    document.documentElement.style.setProperty('--touch-opacity', String(s.touchOpacity));
    this.input.setMaps(s.keysSolo, s.keysP1, s.keysP2);
    this.input.pad1ToP2 = s.pad1ToP2;
    this.touch.scale = s.touchScale;
    if (this.renderer) {
      this.renderer.dprCap = s.quality === 'low' ? 1 : 2;
      this.layout();
    }
  }

  private persist(): void {
    if (!this.save.persist() && this.save.lastError) this.ui.toast('Progress could not be saved in this browser');
  }

  // ================================================================== loop
  private loop(t: number): void {
    requestAnimationFrame((n) => this.loop(n));
    const dt = this.last ? Math.min(0.25, (t - this.last) / 1000) : STEP;
    this.last = t;
    this.trackPerformance(dt);
    this.acc += dt;
    let steps = 0;
    while (this.acc >= STEP && steps < 5) {
      this.tick();
      this.acc -= STEP;
      steps++;
    }
    if (steps >= 5) this.acc = 0;
    this.draw();
  }

  private trackPerformance(dt: number): void {
    if (this.settings.quality !== 'auto' || !this.world || this.paused) return;
    this.frameTimes.push(dt);
    if (this.frameTimes.length < 150) return;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.frameTimes = [];
    if (avg > 1 / 42 && !this.lowQuality) {
      this.lowQuality = true;
      this.renderer.dprCap = Math.max(1, this.renderer.dprCap - 0.5);
      this.layout();
      if (this.world) this.world.fx.budget = 0.6;
    } else if (avg > 1 / 42 && this.renderer.dprCap > 1) {
      this.renderer.dprCap = 1;
      this.layout();
    }
  }

  private get running(): boolean {
    return !!this.world && !this.paused && this.blockers.size === 0 && !this.dialogue && !this.world.gameOver;
  }

  private tick(): void {
    this.frame++;
    const navs = this.input.pollNav();
    for (const n of navs) this.handleNav(n);
    if (this.dialogue) this.tickDialogue();
    if (this.world && this.running) {
      this.input.gameKeysActive = true;
      this.world.update(this.input.read());
      if (this.frame % 10 === 0) this.syncTouchReady();
      if (this.pendingComplete > 0 && --this.pendingComplete === 0) this.afterStageComplete();
    } else {
      this.input.gameKeysActive = !!this.world;
      if (this.world && this.world.complete) {
        this.world.fx.update();
        if (this.pendingComplete > 0 && --this.pendingComplete === 0) this.afterStageComplete();
      }
    }
  }

  private syncTouchReady(): void {
    const w = this.world!;
    for (const h of w.heroes) {
      const slot = h.controller === 'p1' ? 0 : h.controller === 'p2' ? 1 : -1;
      if (slot >= 0) this.touch.setReady(slot, h.specialCd <= 0, w.meter >= 50);
    }
  }

  private handleNav(n: NavAction): void {
    if (this.dialogue && n === 'confirm') {
      this.advanceDialogue();
      return;
    }
    if (this.ui.open) {
      this.ui.nav(n);
      return;
    }
    if (!this.world) return;
    if (n === 'pause' && !this.world.complete && !this.world.gameOver) this.pause();
    if (n === 'swap') this.swapHero();
  }

  private draw(): void {
    if (!this.renderer) return;
    if (this.world) {
      const reduced = this.settings.reducedMotion;
      this.world.fx.shakeEnabled = this.settings.shake;
      this.world.fx.reduced = reduced;
      this.renderer.render(this.world, this.frame, { reduced, quality: this.settings.quality === 'low' || this.lowQuality ? 'low' : 'high' });
      drawHud(this.renderer.g, this.world, this.renderer.viewW, this.sprites, this.frame);
    } else {
      this.renderer.renderBackdrop(this.menuTheme, this.settings.reducedMotion ? 0 : this.frame, false);
    }
  }

  // ================================================================== menus
  private heroImg(id: HeroId, cls = ''): string {
    return `<img class="${cls}" src="${this.sprites[id].fullUrl}" alt="${HEROES[id].name}, from your drawing" draggable="false">`;
  }

  showTitle(): void {
    this.leaveGame();
    this.menuTheme = 'meadow';
    this.audio.playMusic(MUSIC_MENU);
    const c = this.campaign;
    const saveNote = !this.save.available
      ? 'Saving is unavailable in this browser (private mode or blocked storage). You can still play.'
      : c
        ? `Saved: page ${Math.min(c.unlocked + 1, STAGE_COUNT)} of ${STAGE_COUNT} · ${c.ink} ink · ${totalPencils(c)} golden pencils`
        : 'Progress saves automatically on this device.';
    this.ui.show(
      `<div class="title-wrap">
        <div>
          <h1 class="logo">Momo <span class="amp">&amp;</span> Scout<small>Ink Rush</small></h1>
          <div class="menu" style="margin-top:18px">
            <button class="btn primary" data-act="new">New Game</button>
            <button class="btn" data-act="continue" ${c ? '' : 'disabled'}>Continue</button>
            <button class="btn" data-act="heroes">Heroes</button>
            <button class="btn" data-act="howto">How to Play</button>
            <button class="btn" data-act="settings">Settings</button>
            <button class="btn" data-act="credits">Credits</button>
          </div>
          <p class="save-note">${esc(saveNote)}</p>
        </div>
        <div class="heroes-art">${this.heroImg('momo')}${this.heroImg('scout')}</div>
      </div>`,
      {
        new: () => this.newGame(),
        continue: () => this.showMap(),
        heroes: () => this.showHeroes(() => this.showTitle()),
        howto: () => this.showHowTo(() => this.showTitle()),
        settings: () => this.showSettings(() => this.showTitle()),
        credits: () => this.showCredits(() => this.showTitle()),
      },
      { focus: c ? '[data-act="continue"]' : '[data-act="new"]' },
    );
  }

  private async newGame(): Promise<void> {
    const c = this.campaign;
    if (c) {
      const ok = await this.ui.confirm('Start a new game?', `This replaces your saved progress (page ${Math.min(c.unlocked + 1, STAGE_COUNT)}, ${c.ink} ink, ${totalPencils(c)} golden pencils, all upgrades).`, 'Start over', 'Keep my save');
      if (!ok) return;
    }
    this.showModeSelect();
  }

  private twoPlayerTouchOk(): boolean {
    const coarse = matchMedia('(pointer: coarse)').matches;
    if (!coarse) return true;
    if (this.input.gamepadCount > 0) return true;
    return Math.max(window.innerWidth, window.innerHeight) >= 700 && Math.min(window.innerWidth, window.innerHeight) >= 360;
  }

  private showModeSelect(): void {
    const ok2 = this.twoPlayerTouchOk();
    this.ui.show(
      `<div class="card">
        <p class="eyebrow">New game</p>
        <h2>Who's playing?</h2>
        <div class="grid2">
          <div class="hero-card">
            <h3>Solo</h3>
            <p>You control one hero. The other one is a computer partner who fights beside you, revives you and helps with team plates. Switch heroes any time.</p>
            <button class="btn primary" data-act="solo">Play solo</button>
          </div>
          <div class="hero-card">
            <h3>Two players, one device</h3>
            <p>Player 1 is Momo, Player 2 is Scout. Share a keyboard, use two gamepads, or split a tablet screen.</p>
            <button class="btn" data-act="coop" ${ok2 ? '' : 'disabled'}>Play together</button>
            ${ok2 ? '' : '<p class="eyebrow">Needs a bigger screen, a keyboard or a gamepad. This phone is best for solo.</p>'}
          </div>
        </div>
        <div class="row" style="margin-top:14px"><button class="btn" data-act="back">Back</button></div>
      </div>`,
      { solo: () => this.showHeroSelect(), coop: () => this.beginCampaign('coop', 'momo'), back: () => this.showTitle() },
      { back: () => this.showTitle() },
    );
  }

  private statPips(n: number): string {
    return `<span class="pips" aria-label="${n} of 5">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
  }

  private heroCard(id: HeroId, withMoves: boolean, action?: string): string {
    const d = HEROES[id];
    const stats: Record<HeroId, [number, number, number, number]> = { momo: [3, 5, 3, 2], scout: [5, 3, 4, 5] };
    const [hp, spd, pow, def] = stats[id];
    return `<div class="hero-card ${id}">
      ${this.heroImg(id)}
      <h3>${d.name} <span class="chip">${esc(d.role)}</span></h3>
      <p style="font-size:18px">${esc(d.blurb)}</p>
      <div class="stat"><span>Health</span>${this.statPips(hp)}</div>
      <div class="stat"><span>Speed</span>${this.statPips(spd)}</div>
      <div class="stat"><span>Power</span>${this.statPips(pow)}</div>
      <div class="stat"><span>Defense</span>${this.statPips(def)}</div>
      ${withMoves ? `<ul class="moves">${d.moves.map((m) => `<li><b>${esc(m.name)}</b> · ${esc(m.text)}</li>`).join('')}</ul>` : ''}
      ${action ? `<button class="btn ${id === 'momo' ? 'momo' : 'scout'}" data-act="${action}">Play as ${d.name}</button>` : ''}
    </div>`;
  }

  private showHeroSelect(): void {
    this.ui.show(
      `<div class="card wide">
        <p class="eyebrow">Solo</p>
        <h2>Choose your hero</h2>
        <div class="grid2">${this.heroCard('momo', false, 'pickMomo')}${this.heroCard('scout', false, 'pickScout')}</div>
        <div class="row" style="margin-top:14px"><button class="btn" data-act="back">Back</button></div>
      </div>`,
      { pickMomo: () => this.beginCampaign('solo', 'momo'), pickScout: () => this.beginCampaign('solo', 'scout'), back: () => this.showModeSelect() },
      { back: () => this.showModeSelect() },
    );
  }

  private beginCampaign(mode: 'solo' | 'coop', hero: HeroId): void {
    this.save.startCampaign(mode, hero);
    this.input.mode = mode;
    this.showStory(INTRO, () => {
      if (this.campaign) {
        this.campaign.introSeen = true;
        this.persist();
      }
      this.startStage(0);
    });
  }

  private storyArt(p: StoryPanel): string {
    switch (p.art) {
      case 'both':
        return `<div class="art">${this.heroImg('momo')}${this.heroImg('scout')}</div>`;
      case 'momo':
        return `<div class="art single">${this.heroImg('momo')}</div>`;
      case 'scout':
        return `<div class="art single">${this.heroImg('scout')}</div>`;
      case 'king':
        return `<div class="art"><span class="big-glyph" style="color:#2d1b4e" aria-hidden="true">✺</span></div>`;
      case 'pencil':
        return `<div class="art"><span class="big-glyph" style="color:#e9a800" aria-hidden="true">✎</span></div>`;
      case 'drop':
        return `<div class="art"><span class="big-glyph" style="color:#1b1730" aria-hidden="true">•‿•</span></div>`;
      case 'end':
        return `<div class="art">${this.heroImg('momo')}<span class="big-glyph" aria-hidden="true" style="font-size:60px">•‿•</span>${this.heroImg('scout')}</div>`;
    }
  }

  showStory(panels: StoryPanel[], done: () => void, i = 0): void {
    if (i >= panels.length) {
      done();
      return;
    }
    const p = panels[i];
    this.ui.show(
      `<div class="card wide">
        <div class="story">
          ${this.storyArt(p)}
          <div>
            <p class="eyebrow">${i + 1} / ${panels.length}</p>
            <p>${esc(p.text)}</p>
            <div class="row" style="margin-top:14px">
              <button class="btn primary" data-act="next">${i === panels.length - 1 ? "Let's go!" : 'Next'}</button>
              <button class="btn" data-act="skip">Skip</button>
            </div>
          </div>
        </div>
      </div>`,
      { next: () => this.showStory(panels, done, i + 1), skip: () => done() },
      { back: () => done() },
    );
  }

  showMap(): void {
    this.leaveGame();
    const c = this.campaign;
    if (!c) return this.showTitle();
    this.input.mode = c.mode;
    this.audio.playMusic(MUSIC_MENU);
    const lv = levelFromXp(c.xp);
    const pages = STAGES.map((s, i) => {
      const locked = i > c.unlocked;
      const best = c.best[i];
      const pencils = c.pencils[i].map((g) => `<span class="${g ? 'got' : ''}" aria-label="${g ? 'found' : 'missing'}">✎</span>`).join('');
      return `<div class="page ${locked ? 'locked' : ''}">
        <span class="eyebrow">Page ${i + 1}</span>
        <h3>${esc(s.name)}</h3>
        <div class="row">${best ? `<span class="rating">${best.rating}</span>` : ''}<span class="pencils">${pencils}</span></div>
        <span class="chip ${c.challenges[i] ? 'good' : ''}">${c.challenges[i] ? '✓ ' : ''}${esc(s.challenge.label)}</span>
        <button class="btn ${!locked && !c.completed[i] ? 'primary' : ''} small" data-act="play" data-i="${i}" ${locked ? 'disabled' : ''}>${locked ? 'Locked' : c.completed[i] ? 'Replay' : 'Play'}</button>
      </div>`;
    }).join('');
    const next = Math.min(c.unlocked, STAGE_COUNT - 1);
    this.ui.show(
      `<div class="card wide">
        <p class="eyebrow">${c.mode === 'coop' ? 'Two players' : `Solo · playing as ${HEROES[c.soloHero].name}`}${c.finished ? ' · Story complete!' : ''}</p>
        <h2>The Sketchbook</h2>
        <div class="wallet" style="margin-bottom:10px"><span>◆ ${c.ink} ink</span><span>✎ ${totalPencils(c)}/15 pencils</span><span>Team level ${lv.level}</span></div>
        <div class="pages">${pages}</div>
        <div class="row" style="margin-top:14px">
          <button class="btn" data-act="upgrades">Upgrades</button>
          ${c.mode === 'solo' ? `<button class="btn" data-act="swapHero">Play as ${HEROES[c.soloHero === 'momo' ? 'scout' : 'momo'].name} instead</button>` : ''}
          <button class="btn" data-act="back">Main menu</button>
        </div>
      </div>`,
      {
        play: (el) => this.startStage(Number(el.dataset.i)),
        upgrades: () => this.showUpgrades(() => this.showMap()),
        swapHero: () => {
          c.soloHero = c.soloHero === 'momo' ? 'scout' : 'momo';
          this.persist();
          this.showMap();
        },
        back: () => this.showTitle(),
      },
      { back: () => this.showTitle(), focus: `[data-act="play"][data-i="${next}"]` },
    );
  }

  showHeroes(back: () => void): void {
    this.ui.show(
      `<div class="card wide">
        <p class="eyebrow">Your drawings, as heroes</p>
        <h2>Heroes</h2>
        <div class="grid2">${this.heroCard('momo', true)}${this.heroCard('scout', true)}</div>
        <div class="row" style="margin-top:14px"><button class="btn" data-act="back">Back</button></div>
      </div>`,
      { back },
      { back },
    );
  }

  private keyTable(map: Record<KeyAction, string[]>): string {
    return KEY_ACTIONS.map((a) => `<span>${esc(ACTION_LABELS[a])}</span><span>${map[a].map((k) => `<kbd>${esc(keyLabel(k))}</kbd>`).join(' ')}</span>`).join('');
  }

  showHowTo(back: () => void): void {
    const s = this.settings;
    this.ui.show(
      `<div class="card wide">
        <p class="eyebrow">How to play</p>
        <h2>Fight together, finish together</h2>
        <div class="grid2">
          <div>
            <h3>Keyboard · solo</h3>
            <div class="keys">${this.keyTable(applyOverrides(KEYS_SOLO, s.keysSolo))}<span>Pause</span><span><kbd>Esc</kbd> <kbd>P</kbd></span><span>Switch hero</span><span><kbd>Tab</kbd></span></div>
          </div>
          <div>
            <h3>Gamepad</h3>
            <div class="keys">
              <span>Move</span><span><kbd>Left stick</kbd> <kbd>D-pad</kbd></span>
              <span>Jump</span><span><kbd>A</kbd></span>
              <span>Light / Heavy</span><span><kbd>X</kbd> <kbd>Y</kbd></span>
              <span>Special</span><span><kbd>B</kbd></span>
              <span>Dodge / Block</span><span><kbd>RB</kbd></span>
              <span>Interact / Revive</span><span><kbd>LB</kbd></span>
              <span>Ultimate / Finisher</span><span><kbd>RT</kbd></span>
              <span>Pause / Switch hero</span><span><kbd>Start</kbd> <kbd>Select</kbd></span>
            </div>
            <h3 style="margin-top:12px">Touch</h3>
            <p style="font-size:17px">Drag anywhere on the left half to move (up and down walk deeper into the page). Buttons on the right: HIT, !! heavy, JUMP, ★ special, DODGE (hold still to block), TEAM, + HELP, SWAP.</p>
          </div>
          <div>
            <h3>Two players · keyboard</h3>
            <p class="eyebrow">Player 1 (Momo)</p>
            <div class="keys">${this.keyTable(applyOverrides(KEYS_P1, s.keysP1))}</div>
            <p class="eyebrow" style="margin-top:8px">Player 2 (Scout)</p>
            <div class="keys">${this.keyTable(applyOverrides(KEYS_P2, s.keysP2))}</div>
          </div>
          <div>
            <h3>Teamwork</h3>
            <ul class="moves">
              <li><b>Team bonus</b> · Hit an enemy right after your partner does for +25% damage. Launched enemies take +35% RELAY damage from the other hero.</li>
              <li><b>Co-op combo</b> · Stand next to your partner and press Interact (costs 25% Team meter).</li>
              <li><b>Ultimate</b> · At 50% meter, Ultimate fires your own super move.</li>
              <li><b>Team Finisher</b> · At 100% meter with your partner nearby, both heroes hit everything on screen.</li>
              <li><b>Revive</b> · A downed hero has 10 seconds. Hold Interact next to them.</li>
              <li><b>Team plates</b> · Gates open only when both heroes stand on the two plates at once.</li>
              <li><b>Parry</b> · Start blocking right as a hit lands: no damage, and the attacker is stunned.</li>
              <li><b>Telegraphs</b> · <b>!</b> means an attack is coming; <b>!!</b> means it is heavy or cannot be blocked: dodge it.</li>
            </ul>
          </div>
        </div>
        <div class="row" style="margin-top:14px"><button class="btn" data-act="back">Back</button></div>
      </div>`,
      { back },
      { back },
    );
  }

  showCredits(back: () => void, ending = false): void {
    this.ui.show(
      `<div class="card">
        <p class="eyebrow">${ending ? 'The end' : 'Credits'}</p>
        <h2>${ending ? 'Thanks for playing!' : 'Momo & Scout: Ink Rush'}</h2>
        <div class="heroes-art" style="margin:6px 0 12px">${this.heroImg('momo')}${this.heroImg('scout')}</div>
        <table class="stats">
          <tr><td>Momo and Scout</td><td>Drawn by you</td></tr>
          <tr><td>Game design, code, enemy doodles, music</td><td>Made for this sketchbook</td></tr>
          <tr><td>Built with</td><td>TypeScript, Canvas, Web Audio</td></tr>
          <tr><td>Fonts</td><td>Lilita One, Patrick Hand</td></tr>
        </table>
        <div class="row" style="margin-top:14px">
          ${ending ? '<button class="btn primary" data-act="map">Back to the sketchbook</button>' : ''}
          <button class="btn" data-act="back">${ending ? 'Main menu' : 'Back'}</button>
        </div>
      </div>`,
      { back, map: () => this.showMap() },
      { back },
    );
  }

  // ------------------------------------------------------------------ settings
  showSettings(back: () => void): void {
    const s = this.settings;
    const range = (id: string, label: string, v: number, min: number, max: number, step: number) =>
      `<label class="setting" for="${id}"><span>${label}</span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${v}"></label>`;
    const toggle = (id: string, label: string, v: boolean) =>
      `<div class="setting"><span id="${id}-l">${label}</span><button class="btn small" id="${id}" data-act="toggle" data-key="${id}" aria-pressed="${v}" aria-labelledby="${id}-l">${v ? 'On' : 'Off'}</button></div>`;
    this.ui.show(
      `<div class="card">
        <p class="eyebrow">Settings</p>
        <h2>Settings</h2>
        ${range('music', 'Music volume', s.music, 0, 1, 0.05)}
        ${range('sfx', 'Sound effects volume', s.sfx, 0, 1, 0.05)}
        ${toggle('shake', 'Screen shake', s.shake)}
        ${toggle('reducedMotion', 'Reduced motion (calmer effects)', s.reducedMotion)}
        ${toggle('hints', 'Tutorial hints', s.hints)}
        <div class="setting"><span>Graphics quality</span><span class="row">${(['auto', 'high', 'low'] as const).map((q) => `<button class="btn small ${s.quality === q ? 'selected' : ''}" data-act="quality" data-q="${q}" aria-pressed="${s.quality === q}">${q[0].toUpperCase() + q.slice(1)}</button>`).join('')}</span></div>
        ${range('touchScale', 'Touch button size', s.touchScale, 0.7, 1.4, 0.05)}
        ${range('touchOpacity', 'Touch button opacity', s.touchOpacity, 0.25, 1, 0.05)}
        ${toggle('pad1ToP2', 'Two players: first gamepad controls Player 2', s.pad1ToP2)}
        <div class="row" style="margin-top:14px">
          <button class="btn" data-act="keys">Remap keys</button>
          <button class="btn danger" data-act="erase" ${this.campaign ? '' : 'disabled'}>Erase saved game</button>
          <button class="btn primary" data-act="back">Done</button>
        </div>
      </div>`,
      {
        toggle: (el) => {
          const k = el.dataset.key as 'shake' | 'reducedMotion' | 'hints' | 'pad1ToP2';
          s[k] = !s[k];
          el.setAttribute('aria-pressed', String(s[k]));
          el.textContent = s[k] ? 'On' : 'Off';
          this.applySettings();
          this.persist();
        },
        quality: (el) => {
          s.quality = el.dataset.q as Settings['quality'];
          this.lowQuality = false;
          this.applySettings();
          this.persist();
          el.parentElement!.querySelectorAll('button').forEach((b) => {
            const on = b === el;
            b.classList.toggle('selected', on);
            b.setAttribute('aria-pressed', String(on));
          });
        },
        keys: () => this.showRemap('solo', () => this.showSettings(back)),
        erase: async () => {
          const ok = await this.ui.confirm('Erase saved game?', 'Your pages, ink, golden pencils and upgrades will be deleted. Settings are kept.', 'Erase');
          if (ok) {
            this.save.eraseCampaign();
            this.ui.toast('Saved game erased');
            this.showSettings(back);
          }
        },
        back: () => {
          this.persist();
          back();
        },
      },
      {
        back: () => {
          this.persist();
          back();
        },
        onInput: (el) => {
          const v = Number(el.value);
          if (el.id === 'music' || el.id === 'sfx' || el.id === 'touchScale' || el.id === 'touchOpacity') {
            (s as unknown as Record<string, number>)[el.id] = v;
            this.applySettings();
            if (el.id === 'sfx') this.audio.play('coin');
          }
        },
      },
    );
  }

  private showRemap(set: 'solo' | 'p1' | 'p2', back: () => void): void {
    const s = this.settings;
    const overrides: KeyOverrides = set === 'solo' ? s.keysSolo : set === 'p1' ? s.keysP1 : s.keysP2;
    const base = set === 'solo' ? KEYS_SOLO : set === 'p1' ? KEYS_P1 : KEYS_P2;
    const map = applyOverrides(base, overrides);
    const rows = KEY_ACTIONS.map(
      (a) => `<span>${esc(ACTION_LABELS[a])}</span><button class="btn small" data-act="bind" data-a="${a}">${map[a].map((k) => esc(keyLabel(k))).join(' / ')}</button>`,
    ).join('');
    this.ui.show(
      `<div class="card">
        <p class="eyebrow">Settings · keys</p>
        <h2>Remap keys</h2>
        <div class="tabs">
          ${(['solo', 'p1', 'p2'] as const).map((k) => `<button class="btn small ${k === set ? 'selected' : ''}" aria-pressed="${k === set}" data-act="tab" data-set="${k}">${k === 'solo' ? 'Solo' : k === 'p1' ? '2P: Player 1' : '2P: Player 2'}</button>`).join('')}
        </div>
        <p style="font-size:17px">Choose an action, then press the new key. Esc cancels. Movement and other default keys still work as backups.</p>
        <div class="keys">${rows}</div>
        <div class="row" style="margin-top:14px">
          <button class="btn" data-act="reset">Reset to defaults</button>
          <button class="btn primary" data-act="back">Done</button>
        </div>
      </div>`,
      {
        tab: (el) => this.showRemap(el.dataset.set as 'solo' | 'p1' | 'p2', back),
        bind: (el) => {
          el.textContent = 'Press a key…';
          el.classList.add('selected');
          this.input.captureKey((code) => {
            if (code) {
              overrides[el.dataset.a as KeyAction] = code;
              this.applySettings();
              this.persist();
            }
            this.showRemap(set, back);
          });
        },
        reset: () => {
          for (const k of Object.keys(overrides)) delete overrides[k as KeyAction];
          this.applySettings();
          this.persist();
          this.showRemap(set, back);
        },
        back,
      },
      { back },
    );
  }

  // ------------------------------------------------------------------ upgrades
  showUpgrades(next: () => void, nextLabel = 'Done'): void {
    const c = this.campaign;
    if (!c) return next();
    const col = (owner: 'momo' | 'scout' | 'team', title: string) => {
      const items = UPGRADES.filter((u) => u.owner === owner)
        .map((u) => {
          const q = quoteUpgrade(c, u.id);
          const pips = `<span class="pips">${u.costs.map((_, i) => `<i class="${i < q.level ? 'on' : ''}"></i>`).join('')}</span>`;
          const label = q.maxed ? (u.costs.length === 1 ? 'Learned' : 'Maxed') : `${u.costs.length === 1 ? 'Learn' : 'Upgrade'} · ◆ ${q.cost}${q.pencilsNeeded ? ` · ✎ ${q.pencilsNeeded}` : ''}`;
          return `<div class="upg">
            <div class="row" style="justify-content:space-between"><h3 style="margin:0">${esc(u.name)}</h3>${pips}</div>
            <p>${esc(u.text)}</p>
            <button class="btn small ${q.canBuy ? 'primary' : ''}" data-act="buy" data-id="${u.id}" ${q.canBuy ? '' : 'disabled'}>${esc(label)}</button>
            ${!q.maxed && q.reason ? `<span class="eyebrow">${esc(q.reason)}</span>` : ''}
          </div>`;
        })
        .join('');
      return `<div class="col"><h3>${title}</h3>${items}</div>`;
    };
    this.ui.show(
      `<div class="card wide">
        <p class="eyebrow">Spend ink, unlock skills with golden pencils</p>
        <h2>Upgrades</h2>
        <div class="wallet" style="margin-bottom:10px"><span>◆ ${c.ink} ink</span><span>✎ ${totalPencils(c)} golden pencils</span><span>Team level ${levelFromXp(c.xp).level}</span></div>
        <div class="grid3">${col('momo', 'Momo')}${col('scout', 'Scout')}${col('team', 'Team')}</div>
        <div class="row" style="margin-top:14px"><button class="btn primary" data-act="next">${esc(nextLabel)}</button></div>
      </div>`,
      {
        buy: (el) => {
          if (buyUpgrade(c, el.dataset.id as never)) {
            this.audio.play('pencil');
            this.persist();
            this.showUpgrades(next, nextLabel);
            (this.ui.root.querySelector(`[data-id="${el.dataset.id}"]`) as HTMLElement | null)?.focus();
          }
        },
        next,
      },
      { back: next, focus: '[data-act="buy"]:not([disabled])' },
    );
  }

  // ================================================================== game flow
  private leaveGame(): void {
    this.world = null;
    this.paused = false;
    this.blockers.clear();
    this.closeDialogue();
    this.ui.clearOverlays();
    this.appEl.classList.remove('playing');
    this.updateTouchVisibility();
    this.input.gameKeysActive = false;
    this.pendingComplete = -1;
  }

  startStage(i: number, checkpoint: Checkpoint | null = null): void {
    const c = this.campaign;
    if (!c) return this.showTitle();
    this.ui.hide();
    this.ui.clearOverlays();
    this.closeDialogue();
    if (!checkpoint) this.carry = null;
    this.stageIndex = i;
    this.paused = false;
    this.blockers.clear();
    this.pendingComplete = -1;
    this.input.mode = c.mode;
    this.input.clear();
    this.touch.releaseAll();
    const stage = STAGES[i];
    this.renderer.prewarm(stage.theme);
    this.world = new World({
      stage,
      stageIndex: i,
      mode: c.mode,
      soloHero: c.soloHero,
      campaign: c,
      listener: this.listener(),
      audio: this.audio,
      viewW: this.renderer.viewW,
      checkpoint,
      carry: checkpoint ? this.carry : null,
      seed: (Date.now() & 0xffff) + i,
    });
    this.world.fx.budget = this.lowQuality ? 0.6 : 1;
    this.appEl.classList.add('playing');
    this.touch.build(c.mode);
    this.layout();
    this.updateTouchVisibility();
    this.audio.playMusic(stage.music);
    this.addPauseButton();
    // stage card
    this.blockers.add('card');
    const card = this.ui.overlay(
      'card',
      `<p class="eyebrow">${checkpoint ? 'Checkpoint' : `Page ${i + 1} of ${STAGE_COUNT}`}</p><h2>${esc(stage.name)}</h2><p>${esc(stage.subtitle)}</p><p class="eyebrow" style="margin-top:6px">Challenge: ${esc(stage.challenge.label)}</p>`,
      0,
      'card-intro',
    );
    const go = () => {
      if (!this.blockers.has('card')) return;
      this.ui.clearOverlay('card');
      this.blockers.delete('card');
      if (!checkpoint && stage.intro.length) this.openDialogue(stage.intro, () => {});
    };
    card.addEventListener('pointerdown', go);
    window.setTimeout(go, 2200);
  }

  /** Attract-mode / QA: both heroes AI-controlled from a given point of a stage. */
  startDemo(i: number, eventIndex: number, x: number): void {
    this.leaveGame();
    this.ui.hide();
    const stage = STAGES[i];
    this.stageIndex = i;
    const camp = this.campaign;
    this.world = new World({
      stage,
      stageIndex: i,
      mode: 'solo',
      soloHero: 'momo',
      campaign: camp,
      listener: {
        ...this.listener(),
        onDialogue: () => {},
        onBossIntro: () => this.audio.playMusic(MUSIC_BOSS),
        onStageComplete: () => this.ui.toast('Demo complete'),
        onGameOver: () => this.ui.toast('Demo over'),
      },
      audio: this.audio,
      viewW: this.renderer.viewW,
      checkpoint: { eventIndex, x, openGates: [] },
      seed: 42,
      autoplay: true,
    });
    this.appEl.classList.add('playing');
    this.layout();
  }

  private addPauseButton(): void {
    this.ui.clearOverlay('pause');
    const b = document.createElement('button');
    b.className = 'pause-btn';
    b.dataset.key = 'pause';
    b.type = 'button';
    b.setAttribute('aria-label', 'Pause');
    b.textContent = '❚❚';
    b.addEventListener('click', () => this.pause());
    this.ui.hud.append(b);
  }

  private listener(): WorldListener {
    return {
      onDialogue: (lines) => this.openDialogue(lines, () => {}),
      onBossIntro: (boss, lines) => this.bossIntro(boss, lines),
      onBossDefeated: (boss) => {
        this.audio.stopMusic();
        this.ui.overlay('shout', `${esc(boss.def.name)} is defeated!`, 2600, 'shout');
      },
      onHint: (id) => this.hint(id),
      onObjective: () => {},
      onBossShout: (name, text) => this.ui.overlay('shout', `<b>${esc(name)}:</b> ${esc(text)}`, 3000, 'shout'),
      onStageComplete: () => {
        this.pendingComplete = 70;
      },
      onGameOver: () => this.showGameOver(),
      onCheckpoint: () => {
        if (this.world && this.world.frame > 60) this.ui.toast('Checkpoint');
      },
    };
  }

  private hint(id: HintId | 'twins' | 'finale' | 'out' | 'swap'): void {
    if (!this.settings.hints && !ESSENTIAL_HINTS.has(id)) return;
    const mode = this.world?.mode ?? 'solo';
    const text = hintText(id, this.input.lastDevice, mode);
    this.ui.overlay('hint', `<b>TIP</b> ${esc(text)}`, id === 'finale' ? 8000 : 6500, 'banner');
  }

  private bossIntro(boss: Enemy, lines: DialogueLine[] | undefined): void {
    this.blockers.add('boss');
    this.audio.playMusic(MUSIC_BOSS);
    const card = this.ui.overlay('card', `<p class="eyebrow">Boss</p><h2>${esc(boss.def.name)}</h2><p>${esc(boss.def.title ?? '')}</p>`, 0, 'card-intro boss');
    const go = () => {
      if (!this.blockers.has('boss')) return;
      this.ui.clearOverlay('card');
      this.blockers.delete('boss');
      if (lines?.length) this.openDialogue(lines, () => {});
    };
    card.addEventListener('pointerdown', go);
    window.setTimeout(go, 1900);
  }

  // ------------------------------------------------------------------ dialogue
  openDialogue(lines: DialogueLine[], done: () => void): void {
    if (this.dialogue) {
      // queue behind the current conversation
      const prev = this.dialogue.done;
      this.dialogue.lines.push(...lines);
      this.dialogue.done = () => {
        prev();
        done();
      };
      return;
    }
    const el = document.createElement('div');
    el.className = 'dialogue';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-live', 'polite');
    el.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('[data-skip]')) return;
      this.advanceDialogue();
    });
    this.ui.hud.append(el);
    this.dialogue = { lines: [...lines], i: 0, shown: 0, el, done };
    this.renderDialogue();
  }

  private renderDialogue(): void {
    const d = this.dialogue!;
    const line = d.lines[d.i];
    const who = line.who;
    const name = who === 'boss' ? line.name ?? 'Boss' : who === 'narrator' ? '' : HEROES[who].name;
    const face = who === 'momo' || who === 'scout' ? `<div class="face ${who}"><img src="${this.sprites[who].headUrl}" alt=""></div>` : `<div class="face boss" aria-hidden="true">✺</div>`;
    d.el.innerHTML = `${face}<div><div class="who" style="color:${who === 'momo' ? '#d95f12' : who === 'scout' ? '#1f5fcc' : '#6a2c91'}">${esc(name)}</div><div class="line"></div></div>
      <div class="controls"><span class="eyebrow" style="align-self:center">${this.input.lastDevice === 'touch' ? 'Tap to continue' : this.input.lastDevice === 'gamepad' ? 'A to continue' : 'Enter / Space to continue'}</span><button class="btn small" data-skip>Skip</button></div>`;
    d.el.querySelector('[data-skip]')!.addEventListener('click', () => this.closeDialogue(true));
    d.shown = this.settings.reducedMotion ? line.text.length : 0;
    this.updateDialogueText();
  }

  private updateDialogueText(): void {
    const d = this.dialogue!;
    const text = d.lines[d.i].text;
    const el = d.el.querySelector('.line');
    if (el) el.textContent = text.slice(0, Math.floor(d.shown));
  }

  private tickDialogue(): void {
    const d = this.dialogue!;
    const text = d.lines[d.i].text;
    if (d.shown < text.length) {
      d.shown = Math.min(text.length, d.shown + 1.6);
      this.updateDialogueText();
    }
  }

  private advanceDialogue(): void {
    const d = this.dialogue;
    if (!d) return;
    const text = d.lines[d.i].text;
    if (d.shown < text.length) {
      d.shown = text.length;
      this.updateDialogueText();
      return;
    }
    d.i++;
    if (d.i >= d.lines.length) this.closeDialogue(true);
    else this.renderDialogue();
  }

  private closeDialogue(runDone = false): void {
    const d = this.dialogue;
    if (!d) return;
    d.el.remove();
    this.dialogue = null;
    this.input.clear();
    if (runDone) d.done();
  }

  // ------------------------------------------------------------------ pause
  pause(): void {
    if (!this.world || this.paused) return;
    this.paused = true;
    this.touch.releaseAll();
    this.input.clear();
    this.updateTouchVisibility();
    this.showPauseMenu();
  }

  private resume(): void {
    this.paused = false;
    this.ui.hide();
    this.last = performance.now();
    this.acc = 0;
    this.input.clear();
    this.updateTouchVisibility();
    this.audio.resume();
  }

  private showPauseMenu(): void {
    const solo = this.world?.mode === 'solo';
    this.ui.show(
      `<div class="card narrow">
        <p class="eyebrow">${esc(STAGES[this.stageIndex].name)}</p>
        <h2>Paused</h2>
        <div class="menu">
          <button class="btn primary" data-act="resume">Resume</button>
          ${solo ? '<button class="btn" data-act="swap">Switch hero</button>' : ''}
          <button class="btn" data-act="controls">Controls</button>
          <button class="btn" data-act="settings">Settings &amp; audio</button>
          <button class="btn" data-act="restart">Restart from checkpoint</button>
          <button class="btn" data-act="map">Quit to sketchbook</button>
          <button class="btn" data-act="title">Main menu</button>
        </div>
      </div>`,
      {
        resume: () => this.resume(),
        swap: () => {
          this.resume();
          this.swapHero();
        },
        controls: () => this.showHowTo(() => this.showPauseMenu()),
        settings: () => this.showSettings(() => this.showPauseMenu()),
        restart: async () => {
          if (await this.ui.confirm('Restart from checkpoint?', 'Both heroes return to the last checkpoint with full health.', 'Restart')) this.restartCheckpoint();
        },
        map: async () => {
          if (await this.ui.confirm('Quit this page?', 'Progress on this page is lost. Upgrades and completed pages stay saved.', 'Quit')) this.showMap();
        },
        title: async () => {
          if (await this.ui.confirm('Return to the main menu?', 'Progress on this page is lost. Upgrades and completed pages stay saved.', 'Main menu')) this.showTitle();
        },
      },
      { back: () => this.resume(), dim: true },
    );
  }

  private swapHero(): void {
    if (!this.world || this.world.mode !== 'solo' || this.paused) return;
    if (this.world.swapControl()) {
      const p = this.world.heroes.find((h) => h.controller === 'p1')!;
      this.ui.toast(`Now playing as ${p.def.name}`);
    } else this.ui.toast('Your partner is down. Revive them first!');
  }

  restartCheckpoint(): void {
    const w = this.world;
    if (!w) return;
    this.carry = { stats: { ...w.stats }, pencils: [...w.pencilsRun], meter: 0 };
    this.startStage(this.stageIndex, w.checkpoint);
  }

  private showGameOver(): void {
    this.blockers.add('over');
    this.touch.releaseAll();
    (document.getElementById('touch') as HTMLElement).hidden = true;
    this.audio.stopMusic();
    this.audio.play('down');
    this.ui.show(
      `<div class="card narrow">
        <p class="eyebrow">Game over</p>
        <h2>Smudged!</h2>
        <p>Both heroes are down. Pick up the pencil and try again from the last checkpoint with full health.</p>
        <div class="menu">
          <button class="btn primary" data-act="retry">Retry from checkpoint</button>
          <button class="btn" data-act="upg">Upgrades first</button>
          <button class="btn" data-act="map">Sketchbook</button>
          <button class="btn" data-act="title">Main menu</button>
        </div>
      </div>`,
      {
        retry: () => this.restartCheckpoint(),
        upg: () => this.showUpgrades(() => this.restartCheckpoint(), 'Retry'),
        map: () => this.showMap(),
        title: () => this.showTitle(),
      },
      { dim: true },
    );
  }

  // ------------------------------------------------------------------ results
  private afterStageComplete(): void {
    const w = this.world;
    if (!w) return;
    const stage = STAGES[this.stageIndex];
    const proceed = () => this.showResults();
    if (stage.outro.length) this.openDialogue(stage.outro, proceed);
    else proceed();
  }

  private challengeMet(): boolean {
    const w = this.world!;
    const ch = STAGES[this.stageIndex].challenge;
    const s = w.stats;
    switch (ch.id) {
      case 'combo':
        return s.maxCombo >= ch.target;
      case 'noDowns':
        return s.downs === 0;
      case 'parry':
        return s.parries >= ch.target;
      case 'teamHits':
        return s.teamHits >= ch.target;
      case 'pencils':
        return w.pencilsRun.every(Boolean);
      case 'time':
        return s.time <= ch.target;
    }
  }

  private showResults(): void {
    const w = this.world;
    const c = this.campaign;
    if (!w || !c) return;
    this.touch.releaseAll();
    (document.getElementById('touch') as HTMLElement).hidden = true;
    this.ui.clearOverlay('pause');
    const stage = STAGES[this.stageIndex];
    const met = this.challengeMet();
    const reward = applyStageResult(c, this.stageIndex, w.stats, stage.parTime, w.pencilsRun, met);
    this.persist();
    this.audio.playMusic(MUSIC_MENU);
    this.audio.play('pencil');
    const s = w.stats;
    const mm = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
    const last = this.stageIndex === STAGE_COUNT - 1;
    this.ui.show(
      `<div class="card">
        <p class="eyebrow">Page ${this.stageIndex + 1} complete${reward.newBest ? ' · New best!' : ''}</p>
        <h2>${esc(stage.name)}</h2>
        <div class="grid2">
          <div style="text-align:center">
            <div class="rating-big" aria-label="Rating ${reward.rating.rating}">${reward.rating.rating}</div>
            <p class="eyebrow">${reward.rating.points} / 100 points</p>
            <span class="chip ${met ? 'good' : 'warn'}">${met ? '✓ Challenge' : '✗ Challenge'}: ${esc(stage.challenge.label)}</span>
            ${reward.levelAfter > reward.levelBefore ? `<p style="margin-top:10px"><b>Team level up!</b> Level ${reward.levelAfter}: more health and damage for both heroes.</p>` : ''}
          </div>
          <table class="stats">
            <tr><td>Time (par ${mm(stage.parTime)})</td><td>${mm(s.time)}</td></tr>
            <tr><td>Best combo</td><td>${s.maxCombo} hits</td></tr>
            <tr><td>Team &amp; relay hits</td><td>${s.teamHits}</td></tr>
            <tr><td>Damage taken</td><td>${Math.round(s.damageTaken)}</td></tr>
            <tr><td>Times down</td><td>${s.downs}</td></tr>
            <tr><td>Scribbles defeated</td><td>${s.defeated}</td></tr>
            <tr><td>Golden pencils</td><td>${w.pencilsRun.filter(Boolean).length} / 3</td></tr>
            <tr><td>Score</td><td>${s.score.toLocaleString()}</td></tr>
            <tr><td>Ink collected</td><td>◆ ${s.inkCollected}</td></tr>
            <tr><td>Rating bonus</td><td>◆ ${reward.rating.bonus}</td></tr>
            ${reward.challengeBonus ? `<tr><td>Challenge bonus</td><td>◆ ${reward.challengeBonus}</td></tr>` : ''}
            <tr><td><b>Total ink earned</b></td><td>◆ ${reward.inkTotal}</td></tr>
          </table>
        </div>
        <div class="row" style="margin-top:14px">
          <button class="btn primary" data-act="next">${last ? 'See the ending' : 'Upgrades & next page'}</button>
          <button class="btn" data-act="map">Sketchbook</button>
        </div>
      </div>`,
      {
        next: () => {
          if (last) this.showEnding();
          else this.showUpgrades(() => this.startStage(this.stageIndex + 1), `Start page ${this.stageIndex + 2}`);
        },
        map: () => this.showMap(),
      },
      { dim: true },
    );
  }

  private showEnding(): void {
    this.leaveGame();
    this.audio.playMusic(MUSIC_MENU);
    this.showStory(ENDING, () => this.showCredits(() => this.showTitle(), true));
  }
}

function sessionStorageGet(k: string): string | null {
  try {
    return window.sessionStorage.getItem(k);
  } catch {
    return null;
  }
}

function sessionStorageSet(k: string, v: string): void {
  try {
    window.sessionStorage.setItem(k, v);
  } catch {
    /* ignore */
  }
}

const app = new App();
// read-only handle used by the automated browser checks in tools/
Object.defineProperty(window, '__inkrush', {
  value: Object.freeze({
    get world() {
      return app.world;
    },
    get paused() {
      return app.paused;
    },
    demo(stage: number, eventIndex = -1, x = -1) {
      const evs = STAGES[stage].events;
      const ei = eventIndex < 0 ? evs.length - 1 : eventIndex;
      app.startDemo(stage, ei, x < 0 ? evs[ei].x - 250 : x);
    },
  }),
});
void app.boot();
