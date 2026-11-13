import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { allowedEmail } from './access.mjs';
export const authOptions: NextAuthOptions = {
  providers: [GoogleProvider({clientId: process.env.GOOGLE_CLIENT_ID ?? '', clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '', authorization: {params:{scope:'openid email'}}})],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt', maxAge: 60 * 60 },
  cookies: { sessionToken: { name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token', options: {httpOnly:true,sameSite:'lax',path:'/',secure:process.env.NODE_ENV === 'production'} } },
  callbacks: {
    async signIn({account, profile}) {
      const google = profile as {email?:string; email_verified?:boolean} | undefined;
      return account?.provider === 'google' && google?.email_verified === true && allowedEmail(google.email, process.env.ADMIN_ALLOWLIST_EMAILS);
    },
    async jwt({token, account, profile}) {
      if (account) {
        const google = profile as {email?:string; email_verified?:boolean} | undefined;
        delete token.name;
        delete token.picture;
        delete token.sub;
        token.email = google?.email;
        token.emailVerified = account.provider === 'google' && google?.email_verified === true;
      }
      return token;
    },
    async session({session}) {
      // The browser needs no profile fields; authorization reads the encrypted token on the server.
      return {expires:session.expires};
    },
  },
};
