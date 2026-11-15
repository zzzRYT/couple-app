export function allowedEmail(email: unknown, allowlist: string | undefined): boolean;
export function isAllowed(session: unknown, allowlist: string | undefined): boolean;
export function testSession(env: NodeJS.ProcessEnv): {user:{email:string | undefined; emailVerified:boolean}} | null;
