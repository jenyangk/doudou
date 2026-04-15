import { Show } from "solid-js";
import { useSession, signOut } from "../lib/auth-client";
import { Button } from "./ui/Button";
import { useNavigate } from "@tanstack/solid-router";

export function Profile() {
  const session = useSession();
  const navigate = useNavigate();

  return (
    <Show
      when={session()?.data?.user}
      fallback={
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/sign-in" })}>
          Sign In
        </Button>
      }
    >
      {(user) => (
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">{user().email}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut().then(() => navigate({ to: "/" }))}
          >
            Sign Out
          </Button>
        </div>
      )}
    </Show>
  );
}
