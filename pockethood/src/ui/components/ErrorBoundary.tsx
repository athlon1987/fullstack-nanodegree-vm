// Contains a rendering failure to one part of the screen (a panel, the HUD or the 3D view),
// records it in the audit log and offers a way back — the rest of the game keeps running.
import { Component, type ReactNode } from 'react';
import { audit } from '../../platform/security/audit';
import { t } from '../../platform/i18n';

export class ErrorBoundary extends Component<{ area: string; children: ReactNode; onReset?: () => void; quiet?: boolean }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error(`[${this.props.area}]`, error);
    audit({ actor: 'system', action: 'ui.error', target: this.props.area, detail: error.message, level: 'error' });
  }

  reset = () => {
    this.props.onReset?.();
    this.setState({ failed: false });
  };

  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.quiet) return null;
    return (
      <div className="update-toast" role="alert">
        <span>{t('ui.panelError')}</span>
        <button className="btn btn--plain btn--sm" onClick={this.reset}>
          {t('common.close')}
        </button>
      </div>
    );
  }
}
