export type UserVerifier = { getUser(token: string): Promise<{ user: { id: string } | null; error: unknown }> };
export async function requireUser(authorization: string | null, verifier: UserVerifier): Promise<string> {
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);
  if (!match) throw new Error('UNAUTHORIZED');
  const { user, error } = await verifier.getUser(match[1]!);
  if (error || !user) throw new Error('UNAUTHORIZED');
  return user.id;
}
