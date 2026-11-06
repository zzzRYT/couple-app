import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Banner, Card, ListRow, Screen, SectionLabel, Toast } from '../../ui/components';
import { tokens } from '../../theme/tokens';
import { useAppColor } from '../../theme/useAppColor';
import { LoginAddress } from '../auth/passwordUi';
import type { PasswordState } from '../auth/passwordPort';

export type SecurityAction = 'create' | 'change' | 'forgot';
/** A fact about the account, not an action: no chevron, and it reads as one line. */
function InfoRow({ label, value, last = true }: { label: string; value: string; last?: boolean }) {
  const color = useAppColor();
  return (
    <View accessible accessibilityLabel={`${label}, ${value}`} style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing[2], borderBottomWidth: last ? 0 : 1, borderBottomColor: color.border }}>
      <AppText style={{ flexShrink: 1 }}>{label}</AppText>
      <AppText tone="text2">{value}</AppText>
    </View>
  );
}
/** V0-sec-apple-nopw, V0-sec-apple-pw and V0-sec-email: the same screen for what the account holds. */
export function SecurityScreen({ state, apple, saved, copy, onAction, onBack, onSavedHidden }: { state: PasswordState | null | undefined; apple: boolean; saved?: boolean; copy: (value: string) => Promise<unknown>; onAction: (action: SecurityAction) => void; onBack: () => void; onSavedHidden?: () => void }) {
  const { t } = useTranslation();
  const hasPassword = !!state?.hasPassword;
  const email = state?.email ?? null;
  return (
    <Screen onBack={onBack} footer={saved ? <Toast text={t('set.pw.saved')} onHide={onSavedHidden} /> : undefined}>
      <AppText variant="title" accessibilityRole="header">{t('set.security.title')}</AppText>
      {state === null && <Banner kind="danger" text={t('state.error.title')} />}
      <SectionLabel text={t('set.security.method')} />
      <Card>
        {apple && <InfoRow label={t('set.security.method.apple')} value={t('set.security.on')} last={!hasPassword} />}
        {apple && hasPassword && <InfoRow label={t('set.security.method.email')} value={t('set.security.on')} />}
        {!apple && <InfoRow label={t('set.security.method.emailOnly')} value={t('set.security.on')} />}
      </Card>
      {!apple && email && <AppText tone="text2">{email}</AppText>}
      {apple && hasPassword && email && <LoginAddress email={email} copy={copy} />}
      {state && <SectionLabel text={t('set.security.pwSection')} />}
      {state && !hasPassword && <>
        <Card>
          <InfoRow label={t('set.security.pwLabel')} value={t('set.security.pwNone.value')} last={!email} />
          {!!email && <ListRow label={t('auth.setpw.cta')} onPress={() => onAction('create')} />}
        </Card>
        <AppText variant="bodySm" tone="text2">{t('set.security.noneNote')}</AppText>
      </>}
      {hasPassword && <>
        <Card>
          <ListRow label={t(apple ? 'set.security.pwChange' : 'set.security.pwChange.email')} last={false} onPress={() => onAction('change')} />
          <ListRow label={t(apple ? 'set.security.pwForgot' : 'set.security.pwForgot.email')} onPress={() => onAction('forgot')} />
        </Card>
        <AppText variant="bodySm" tone="text2">{t(apple ? 'set.security.pwNote' : 'auth.pw.stored')}</AppText>
      </>}
    </Screen>
  );
}
