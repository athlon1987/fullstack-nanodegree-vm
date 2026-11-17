'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n/client';
import { IconButton } from '@/components/ui/icon-button';

/** Copies a deep link to an answer (`/help/<topic>#<id>`). The label says when it worked. */
export function CopyLinkButton({ anchor }: { anchor: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${anchor}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; fall back to putting the link in the address bar.
      window.history.replaceState(window.history.state, '', `#${anchor}`);
    }
  };
  return (
    <IconButton
      icon={copied ? 'check' : 'copy'}
      size="sm"
      variant="quiet"
      label={copied ? t('guidePages.help.topic.copied') : t('guidePages.help.topic.copyLink')}
      onClick={copy}
    />
  );
}
