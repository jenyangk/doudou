import { createSignal, Show } from "solid-js";
import { useNavigate } from "@tanstack/solid-router";
import { useSession } from "../lib/auth-client";
import { createSession } from "../lib/api";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/Card";
import toast from "solid-toast";

export function CreateSession() {
  const session = useSession();
  const navigate = useNavigate();

  const [name, setName] = createSignal("");
  const [maxUploads, setMaxUploads] = createSignal(1);
  const [maxVotes, setMaxVotes] = createSignal(3);
  const [loading, setLoading] = createSignal(false);

  const isSignedIn = () => !!session()?.data?.user;

  const handleCreate = async () => {
    if (!name()) {
      toast.error("Please enter a session name");
      return;
    }

    setLoading(true);
    try {
      const result = await createSession({
        name: name(),
        maxUploadsPerUser: maxUploads(),
        maxVotesPerUser: maxVotes(),
      });
      toast.success("Session created!");
      navigate({ to: "/sessions/$code", params: { code: result.code } });
    } catch (err: any) {
      toast.error(err.error ?? "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a Session</CardTitle>
        <CardDescription>Start a new photo competition</CardDescription>
      </CardHeader>
      <Show
        when={isSignedIn()}
        fallback={
          <CardContent>
            <p class="text-sm text-gray-500">Please sign in to create sessions.</p>
          </CardContent>
        }
      >
        <CardContent class="space-y-4">
          <div class="space-y-1">
            <label class="text-sm font-medium" for="session-name">Session Name</label>
            <Input
              id="session-name"
              placeholder="My Competition"
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
            />
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium" for="max-uploads">Max Uploads Per User</label>
            <Input
              id="max-uploads"
              type="number"
              min={1}
              max={20}
              value={maxUploads()}
              onInput={(e) => setMaxUploads(parseInt(e.currentTarget.value) || 1)}
            />
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium" for="max-votes">Max Votes Per User</label>
            <Input
              id="max-votes"
              type="number"
              min={1}
              max={50}
              value={maxVotes()}
              onInput={(e) => setMaxVotes(parseInt(e.currentTarget.value) || 3)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button class="w-full" onClick={handleCreate} disabled={loading()}>
            {loading() ? "Creating..." : "Create"}
          </Button>
        </CardFooter>
      </Show>
    </Card>
  );
}
