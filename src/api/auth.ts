import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import type { Env } from "../shared/types";

export function createAuth(env: Env) {
  return betterAuth({
    database: env.DB,
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: { enabled: false },
    plugins: [
      emailOTP({
        async sendVerificationOTP({ email, otp }) {
          console.log(`[DEV] OTP for ${email}: ${otp}`);

          if (env.EMAIL_API_KEY) {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${env.EMAIL_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "DouDou <noreply@doudou.muniee.com>",
                to: email,
                subject: "Your DouDou sign-in code",
                text: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
              }),
            });
          }
        },
      }),
    ],
    trustedOrigins: ["http://localhost:5173", "https://doudou.muniee.com"],
  });
}

export type Auth = ReturnType<typeof createAuth>;
