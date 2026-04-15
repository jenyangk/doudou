import { createSignal, Show } from "solid-js";
import { useNavigate } from "@tanstack/solid-router";
import { authClient, useSession } from "../lib/auth-client";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import toast from "solid-toast";

export default function SignIn() {
  const navigate = useNavigate();
  const session = useSession();

  if (session()?.data?.user) {
    navigate({ to: "/" });
  }

  const [email, setEmail] = createSignal("");
  const [otp, setOtp] = createSignal("");
  const [step, setStep] = createSignal<"email" | "otp">("email");
  const [loading, setLoading] = createSignal(false);

  const sendOtp = async (e: Event) => {
    e.preventDefault();
    if (!email()) return;

    setLoading(true);
    try {
      await authClient.emailOtp.sendVerificationOtp({ email: email() });
      setStep("otp");
      toast.success("Check your email for the verification code");
    } catch (err) {
      toast.error("Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: Event) => {
    e.preventDefault();
    if (!otp()) return;

    setLoading(true);
    try {
      await authClient.signIn.emailOtp({ email: email(), otp: otp() });
      toast.success("Signed in successfully");
      navigate({ to: "/" });
    } catch (err) {
      toast.error("Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="flex items-center justify-center min-h-[80vh] px-4">
      <Card class="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Enter your email to receive a verification code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Show
            when={step() === "otp"}
            fallback={
              <form onSubmit={sendOtp} class="space-y-4">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email()}
                  onInput={(e) => setEmail(e.currentTarget.value)}
                  required
                />
                <Button type="submit" class="w-full" disabled={loading()}>
                  {loading() ? "Sending..." : "Send Code"}
                </Button>
              </form>
            }
          >
            <form onSubmit={verifyOtp} class="space-y-4">
              <p class="text-sm text-gray-500">
                Code sent to <strong>{email()}</strong>
              </p>
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                value={otp()}
                onInput={(e) => setOtp(e.currentTarget.value)}
                maxLength={6}
                class="text-center text-lg tracking-widest"
                required
              />
              <Button type="submit" class="w-full" disabled={loading()}>
                {loading() ? "Verifying..." : "Verify"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                class="w-full"
                onClick={() => setStep("email")}
              >
                Use a different email
              </Button>
            </form>
          </Show>
        </CardContent>
      </Card>
    </div>
  );
}
