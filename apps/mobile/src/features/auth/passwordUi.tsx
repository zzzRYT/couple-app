import { useState } from 'react';
import { Linking, Pressable, Text, View, type TextInputProps } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Card, TextField, WORD_BREAK } from '../../ui/components';
import { Icon } from '../../ui/Icon';
import { tokens } from '../../theme/tokens';
import { useAppColor } from '../../theme/useAppColor';
import { useType } from '../../theme/typography';
import type { PasswordRules } from './passwordRules';
import { isPrivateRelay } from './passwordRules';

/** Every password field on the boards: hidden by default with a 44pt eye inside the field, iOS AutoFill on. `invalid` gives the danger edge of unmet rules without a message. */
export function PasswordField({ label, error, kind = 'current', invalid = false, ...props }: TextInputProps & { label: string; error?: string | null; kind?: 'current' | 'new'; invalid?: boolean }) {
  const { t } = useTranslation();
  const color = useAppColor();
  const [shown, setShown] = useState(false);
  const eye = t(shown ? 'login.pw.hide' : 'login.pw.show');
  return (
    <View>
      <TextField {...props} label={label} error={error} secureTextEntry={!shown} autoCapitalize="none" autoCorrect={false} spellCheck={false}
        textContentType={kind === 'new' ? 'newPassword' : 'password'} autoComplete={kind === 'new' ? 'new-password' : 'current-password'} style={{ paddingRight: 48, ...(invalid ? { borderColor: color.danger } : null) }} />
      <Pressable accessibilityRole="button" accessibilityLabel={`${eye} · ${label}`} hitSlop={2} onPress={() => setShown((value) => !value)}
        style={{ position: 'absolute', right: 4, top: 26, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="eye" size={22} color={shown ? color.primary : color.text2} />
      </Pressable>
    </View>
  );
}
/** The rule list is visible from the start; each line changes to met as the person types. Once something is `typed`, an unmet line turns to a danger warning. Not colour alone: the icon changes too. */
export function RuleList({ rules, typed = false }: { rules: PasswordRules; typed?: boolean }) {
  const { t } = useTranslation();
  const color = useAppColor();
  const lines = [['login.pw.rule.len', rules.length], ['login.pw.rule.mix', rules.mix], ['login.pw.rule.email', rules.notEmail]] as const;
  return (
    <View accessible accessibilityLabel={`${t('login.pw.rules.a11y')}: ${lines.map(([key, met]) => `${t(key)} ${met ? '✓' : ''}`).join(', ')}`} style={{ gap: tokens.spacing[0] }}>
      {lines.map(([key, met]) => {
        const tone = met ? 'success' : typed ? 'danger' : 'text2';
        return (
          <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[1] }}>
            <Icon name={met ? 'check' : typed ? 'warn' : 'close'} size={16} color={color[tone]} />
            <AppText variant="bodySm" tone={tone}>{t(key)}</AppText>
          </View>
        );
      })}
    </View>
  );
}
export function CheckRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  const color = useAppColor();
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel={label} onPress={onToggle} style={{ minHeight: tokens.touch.minimum, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[2] }}>
      <View style={{ width: 24, height: 24, borderWidth: tokens.border.outline.normal, borderColor: color.line, borderRadius: 8, backgroundColor: checked ? color.primary : color.surface, alignItems: 'center', justifyContent: 'center' }}>
        {checked && <Icon name="check" size={16} color={color.onPrimary} />}
      </View>
      <AppText style={{ flexShrink: 1 }}>{label}</AppText>
    </Pressable>
  );
}
/** V0-auth-setpw-done and V0-sec-apple-pw: one card with the address to type on another device and a copy link. The private-address note appears only for an Apple relay address. */
export function LoginAddress({ email, copy }: { email: string; copy: (value: string) => Promise<unknown> }) {
  const { t } = useTranslation();
  const color = useAppColor();
  const { emphasis } = useType();
  return (
    <Card style={{ paddingVertical: tokens.spacing[2], gap: tokens.spacing[0] }}>
      <Text {...WORD_BREAK} style={[emphasis(13), { color: color.text2 }]}>{t('set.security.loginEmail')}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing[1] }}>
        <AppText selectable variant="bodySm" style={{ flex: 1 }}>{email}</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.copy.a11y')} onPress={() => void copy(email)}
          style={({ pressed }) => ({ minWidth: tokens.touch.minimum, minHeight: tokens.touch.minimum, paddingHorizontal: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: tokens.spacing[0], opacity: pressed ? 0.7 : 1 })}>
          <Icon name="copy" size={18} color={color.primary} />
          <Text {...WORD_BREAK} style={[emphasis(14), { color: color.primary }]}>{t('common.copy')}</Text>
        </Pressable>
      </View>
      {isPrivateRelay(email) && <AppText variant="bodySm" tone="text2">{t('set.security.relay')}</AppText>}
    </Card>
  );
}
/** "문의하기 · address": the only way forward for an email account until mail is connected. `link` is the bare text link of V0-auth-signup-nomail. */
export function ContactButton({ link = false }: { link?: boolean }) {
  const { t } = useTranslation();
  const address = t('auth.support.mail');
  const open = () => void Linking.openURL(`mailto:${address}`).catch(() => undefined);
  return link ? <Button variant="ghost" label={t('set.help.contact')} onPress={open} /> : <Button variant="secondary" icon="mail" label={`${t('set.help.contact')} · ${address}`} onPress={open} />;
}
