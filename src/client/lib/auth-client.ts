import { createAuthClient } from "better-auth/solid";

export const authClient = createAuthClient({
  baseURL: window.location.origin + "/api/auth",
});

export const { useSession, signIn, signUp, signOut } = authClient;
