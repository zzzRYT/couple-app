import { useTranslation } from 'react-i18next';
import { AppText, Banner, Card, InfoRow, ListRow, Screen, SectionLabel, Toast } from '../../ui/components';
import { LoginAddress } from '../auth/passwordUi';
import type { PasswordState } from '../auth/passwordPort';

export type SecurityAction = 'create' | 'change' | 'forgot';
/** V0-sec-apple-nopw, V0-sec-apple-pw and V0-sec-email: the same screen for what the account holds. */
export function SecurityScreen({ state, apple, saved, copy, onAction, onBack, onSavedHidden }: { state: PasswordState | null | undefined; apple: boolean; saved?: boolean; copy: (value: string) => Promise<unknown>; onAction: (action: SecurityAction) => void; onBack: () => void; onSavedHidden?: () => void }) {
  const { t } = useTranslation();
  const hasPassword = !!state?.hasPassword;
  const email = state?.email ?? null;
  return (
    <Screen onBack={onBack} title={t('set.security.title')} footer={saved ? <Toast text={t('set.pw.saved')} onHide={onSavedHidden} /> : undefined}>
      {state === null && <Banner kind="danger" text={t('state.error.title')} />}
      <SectionLabel text={t('set.security.method')} />
      <Card>
        {apple && <InfoRow tile="apple" label={t('set.security.method.apple')} value={t('set.security.on')} last={!hasPassword} />}
        {apple && hasPassword && <InfoRow tile="mail" label={t('set.security.method.email')} value={t('set.security.on')} />}
        {!apple && <InfoRow tile="mail" label={t('set.security.method.emailOnly')} subtitle={email ?? undefined} value={t('set.security.on')} />}
      </Card>
      {apple && hasPassword && email && <LoginAddress email={email} copy={copy} />}
      {state && <SectionLabel text={t('set.security.pwSection')} />}
      {state && !hasPassword && <>
        <Card>
          <InfoRow tile="lock" label={t('set.security.pwLabel')} value={t('set.security.pwNone.value')} last={!email} />
          {!!email && <ListRow tile="lock" labelTone="primary" label={t('auth.setpw.cta')} onPress={() => onAction('create')} />}
        </Card>
        <AppText variant="bodySm" tone="text2">{t('set.security.noneNote')}</AppText>
      </>}
      {hasPassword && <>
        <Card>
          <ListRow tile="lock" label={t(apple ? 'set.security.pwChange' : 'set.security.pwChange.email')} last={false} onPress={() => onAction('change')} />
          <ListRow tile="lock" label={t(apple ? 'set.security.pwForgot' : 'set.security.pwForgot.email')} onPress={() => onAction('forgot')} />
        </Card>
        <AppText variant="bodySm" tone="text2">{t(apple ? 'set.security.pwNote' : 'auth.pw.stored')}</AppText>
      </>}
    </Screen>
  );
}
