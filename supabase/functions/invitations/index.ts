import { AppError } from '../_shared/errors.ts';
import { createHandler, defaultDeps, json, route, str, uuidParam, type Deps } from '../_shared/http.ts';
import { formatCode, generateCode, hashCode, normalizeCode } from '../_shared/inviteCode.ts';

export function invitationsHandler(deps: Deps, env: (name: string) => string | undefined = Deno.env.get) {
  const pepper = () => {
    const value = env('INVITE_CODE_PEPPER');
    if (!value) throw new Error('MISSING_SERVER_CONFIG');
    return value;
  };
  const codeHash = async (input: unknown) => {
    const code = normalizeCode(str(input, 32));
    // Malformed input still counts as a failed attempt, so it is hashed like any other unknown code.
    return hashCode(code ?? `invalid:${crypto.randomUUID()}`, pepper());
  };
  return createHandler([
    route('POST', '/spaces/:spaceId/invitations', async ({ userId, params, deps }) => {
      const code = generateCode();
      const issued = await deps.db.rpc<{ invitationId: string; expiresAt: string }>('create_invitation',
        { actor: userId, target: uuidParam(params.spaceId), hash: await hashCode(code, pepper()) });
      return json({ invitationId: issued.invitationId, code: formatCode(code), expiresAt: issued.expiresAt }, 201);
    }),
    route('POST', '/invitations/preview', async ({ userId, body, deps }) =>
      deps.db.rpc('preview_invitation', { actor: userId, hash: await codeHash(body.code) })),
    route('POST', '/invitations/accept', async ({ userId, body, deps }) => {
      if (body.code === undefined) throw new AppError('INVALID_REQUEST');
      return deps.db.rpc('accept_invitation', { actor: userId, hash: await codeHash(body.code) });
    }),
  ], deps);
}
if (import.meta.main) Deno.serve(invitationsHandler(defaultDeps()));
