import { ExternalLink } from '@/components/common/external-link';
import { LocaleLink } from '@/components/common/locale-link';
import { Icon } from '@/components/ui/icon';
import type { GuideActionView } from './guide-views.server';

/** A step's action: an internal link (locale added) or an official external page. */
export function GuideActionLink({ action }: { action: GuideActionView }) {
  return action.external ? (
    <ExternalLink href={action.href} variant="action" className="type-body-sm text-ink">
      {action.label}
    </ExternalLink>
  ) : (
    <LocaleLink href={action.href} className="link-action type-body-sm text-ink">
      {action.label}
      <Icon name="arrow-right" size="sm" />
    </LocaleLink>
  );
}
