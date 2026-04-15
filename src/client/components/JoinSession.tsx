import { createSignal } from "solid-js";
import { useNavigate } from "@tanstack/solid-router";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card";
import toast from "solid-toast";

export function JoinSession() {
  const navigate = useNavigate();
  const [code, setCode] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  const handleJoin = (e: Event) => {
    e.preventDefault();
    const trimmed = code().trim().toUpperCase();
    if (!trimmed) {
      toast.error("Please enter a session code");
      return;
    }
    setLoading(true);
    navigate({ to: "/sessions/$code", params: { code: trimmed } });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join Session</CardTitle>
        <CardDescription>Enter a session code to join</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleJoin} class="space-y-4">
          <Input
            type="text"
            placeholder="Session Code"
            value={code()}
            onInput={(e) => setCode(e.currentTarget.value)}
            class="text-center text-lg uppercase"
            maxLength={6}
            required
          />
          <Button type="submit" class="w-full" disabled={loading()}>
            {loading() ? "Joining..." : "Join Session"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
