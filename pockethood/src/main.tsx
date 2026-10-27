import { createRoot } from 'react-dom/client';
import '@fontsource-variable/fredoka';
import '@fontsource-variable/nunito';
import './ui/styles.css';
import { App } from './app/App';
import { registerServiceWorker } from './services/pwa';

// StrictMode is intentionally not used: its double-mounting tears down the
// imperatively-managed three.js objects and drei <Html> roots in development.
createRoot(document.getElementById('root')!).render(<App />);

registerServiceWorker();
