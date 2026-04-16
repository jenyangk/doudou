import { createAuthClient } from "better-auth/solid";
import { emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: window.location.origin + "/api/auth",
  plugins: [emailOTPClient()],
});

export const { useSession, signIn, signUp, signOut } = authClient;
