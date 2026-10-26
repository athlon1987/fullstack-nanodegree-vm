import { lazy, Suspense, useEffect, useState } from 'react';
import { audio } from '../audio/AudioManager';
import { ALL_MODELS, preloadModels } from '../rendering/models/assets';
import { useGame } from '../state/store';
import { BottomBar, FlyLayer, SideRail, Toasts, TopBar, Tracker } from '../ui/hud/Hud';
import { LoadingScreen } from './LoadingScreen';
import { Overlays } from '../ui/Overlays';

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

  useEffect(() => {
    if (booted) return;
    booted = true;
    (async () => {
      try {
        const base = import.meta.env.BASE_URL;
        audio.setBase(base);
        await Promise.race([document.fonts.load('600 32px "Fredoka Variable"'), new Promise((r) => setTimeout(r, 1500))]);
        await preloadModels(ALL_MODELS, base, (d, t) => setProgress((d / t) * 0.9));
        await useGame.getState().init();
        setProgress(1);
        window.setTimeout(() => setReady(true), 350);
      } catch (e) {
        console.error(e);
        setError('Something went wrong while loading. Please refresh.');
      }
    })();
    const unlock = () => void audio.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }, []);

  useEffect(() => {
    if (!settings) return;
    audio.configure(settings.musicVolume, settings.sfxVolume, settings.muted);
    document.documentElement.style.setProperty('--text-scale', String(settings.textScale));
    document.documentElement.classList.toggle('reduced-motion', settings.reducedMotion);
  }, [settings]);

  return (
    <>
      {loaded && (
        <Suspense fallback={null}>
          <GameCanvas />
        </Suspense>
      )}
      {loaded && !photo && (
        <div className="hud">
          <TopBar />
          {!placing && <Tracker />}
          {!placing && <BottomBar />}
          {!placing && <SideRail />}
        </div>
      )}
      {loaded && <Overlays />}
      {loaded && <Toasts />}
      {loaded && <FlyLayer />}
      <LoadingScreen progress={progress} done={ready} error={error} />
    </>
  );
}
