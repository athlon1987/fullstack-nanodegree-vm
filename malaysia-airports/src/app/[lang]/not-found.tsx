import { lang as routeLang } from 'next/root-params';
import { toLang } from '@/lib/i18n';
import { NotFoundBody } from '@/components/platform/not-found-body';

/**
 * The localised not-found page: unknown pages, unknown airports and airport sections that do not
 * exist. Kept light because it ships with every route under `[lang]`. The body is shared with
 * `MissingPage` (round 4), which renders it on the server for params a static page does not list.
 */
export default async function NotFound() {
  return <NotFoundBody lang={toLang(await routeLang())} />;
}
