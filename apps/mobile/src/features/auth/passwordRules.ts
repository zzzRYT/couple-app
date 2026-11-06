/** Boards V0-08 and V0-09: the three rules shown while typing. The server applies the same ones (functions/auth-password/rules.ts). */
export type PasswordRules = { length: boolean; mix: boolean; notEmail: boolean };
export function passwordRules(password: string, email: string): PasswordRules {
  return { length: password.length >= 8, mix: /[A-Za-z]/.test(password) && /[0-9]/.test(password), notEmail: password.length > 0 && password.toLowerCase() !== email.trim().toLowerCase() };
}
export function rulesMet(rules: PasswordRules): boolean {
  return rules.length && rules.mix && rules.notEmail;
}
export const isPrivateRelay = (email: string | null | undefined) => !!email && /@privaterelay\.appleid\.com$/i.test(email.trim());
