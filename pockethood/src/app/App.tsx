import { lazy, Suspense, useEffect, useState } from 'react';
import { audio, type Bed } from '../audio/AudioManager';
import { WORLD } from '../data/world';
import { behaviorOf } from '../platform/content/install';
import { weatherState } from '../rendering/scene/coords';
import { ALL_MODELS, preloadModels } from '../rendering/models/assets';
import { useGame } from '../state/store';
import { BottomBar, FlyLayer, SideRail, Toasts, TopBar, Tracker } from '../ui/hud/Hud';
import { LoadingScreen } from './LoadingScreen';
import { Overlays } from '../ui/Overlays';
import { ErrorBoundary } from '../ui/components/ErrorBoundary';
import { VisitBanner } from '../ui/panels/SharePanel';
import { t, useT } from '../platform/i18n';
import { usePwa } from '../services/pwa';

const GameCanvas = lazy(() => import('../rendering/scene/GameCanvas').then((m) => ({ default: m.GameCanvas })));

let booted = false;

export function App() {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string>();
  const loaded = useGame((s) => s.loaded);
  const photo = useGame((s) => s.ui.photoMode);
  const placing = useGame((s) => !!s.ui.placing);
  const settings = useGame((s) => s.game?.settings);
  const visiting = useGame((s) => s.visiting);
  const updateReady = usePwa((s) => s.updateReady);
  const applyUpdate = usePwa((s) => s.apply);
  useT();

  useEffect(() => {
    if (booted) return;
    booted = true;
    (async () => {
      try {
        const base = import.meta.env.BASE_URL;
        audio.setBase(base);
        await Promise.race([document.fonts.load('600 32px "Fredoka Variable"'), new Promise((r) => setTimeout(r, 1500))]);
        await preloadModels(ALL_MODELS, base, (d, total) => setProgress((d / total) * 0.9));
        await useGame.getState().init();
        setProgress(1);
        window.setTimeout(() => setReady(true), 350);
      } catch (e) {
        console.error(e);
        setError(t('ui.loadError'));
      }
    })();
    // Keep the soundscape in step with the world: time of day, rain, Zen Mode and what you're looking at.
    window.setInterval(() => {
      const st = useGame.getState();
      const g = st.game;
      if (!g) return;
      const sel = st.ui.selected ? g.buildings.find((b) => b.uid === st.ui.selected) : undefined;
      const lake = st.ui.activity?.kind === 'lake' || sel?.type === 'pond';
      const bed = lake ? 'lake' : sel ? (behaviorOf(sel.type, 'ambient_sound')?.sound ?? 'none') : 'none';
      audio.setScape({ hour: st.ui.hour, rain: weatherState.rain, zen: g.settings.zen, tropical: WORLD.biome === 'tropical', bed: bed as Bed });
    }, 600);
    const unlock = () => void audio.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }, []);

  useEffect(() => {
    if (!settings) return;
    audio.configure({ music: settings.musicVolume, ambience: settings.ambienceVolume, sfx: settings.sfxVolume, character: settings.characterVolume, muted: settings.muted });
    document.documentElement.classList.toggle('zen', settings.zen);
    document.documentElement.style.setProperty('--text-scale', String(settings.textScale));
    document.documentElement.classList.toggle('reduced-motion', settings.reducedMotion);
  }, [settings]);

  return (
    <>
      {loaded && (
        <ErrorBoundary area="world" onReset={() => useGame.getState().setUI({ selected: null })}>
          <Suspense fallback={null}>
            <GameCanvas />
          </Suspense>
        </ErrorBoundary>
      )}
      {loaded && !photo && (
        <ErrorBoundary area="hud">
        <div className="hud">
          <TopBar />
          {visiting && <VisitBanner />}
          {!placing && !settings?.zen && !visiting && <Tracker />}
          {!placing && !visiting && <BottomBar />}
          {!placing && <SideRail />}
        </div>
        </ErrorBoundary>
      )}
      {loaded && (
        <ErrorBoundary area="panels" onReset={() => useGame.getState().setUI({ selected: null, panel: null, activity: null, dialogue: null, dialogueQueue: [] })}>
          <Overlays />
        </ErrorBoundary>
      )}
      {loaded && <Toasts />}
      {loaded && <FlyLayer />}
      {updateReady && (
        <div className="update-toast" role="status">
          <span>{t('ui.updateReady')}</span>
          <button className="btn btn--teal btn--sm" onClick={applyUpdate}>
            {t('ui.updateNow')}
          </button>
        </div>
      )}
      <LoadingScreen progress={progress} done={ready} error={error} />
    </>
  );
}
