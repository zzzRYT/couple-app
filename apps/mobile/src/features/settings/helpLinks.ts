import { APP_IDENTITY } from '../../config/identity';

type Identity = Pick<typeof APP_IDENTITY, 'supportDomain'> & { supportEmail: string | null };
/** The public site keeps Korean at the root and the other languages under `/en/` and `/ja/` (site/). */
const SITE_PREFIX: Record<string, string> = { ko: '', en: '/en', ja: '/ja' };
/** There are no own terms (A-23). Apple's standard EULA governs the app while App Store Connect has no custom EULA. */
export const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
/** `null` when no support email is decided yet (A-23): the contact row is hidden instead of pointing nowhere. */
export function contactUrl(identity: Identity = APP_IDENTITY): string | null {
  return identity.supportEmail ? `mailto:${identity.supportEmail}` : null;
}
export function privacyUrl(language: string, identity: Identity = APP_IDENTITY): string {
  return `https://${identity.supportDomain}${SITE_PREFIX[language.slice(0, 2)] ?? SITE_PREFIX.en}/privacy/`;
}
