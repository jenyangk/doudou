import { Show } from "solid-js";
import { Link } from "@tanstack/solid-router";
import { Profile } from "./Profile";
import { SessionCodeBadge } from "./ui/SessionCodeBadge";

interface HeaderProps {
  sessionCode?: string;
}

export function Header(props: HeaderProps) {
  return (
    <header class="sticky top-0 z-50 border-b-[3px] border-dd-border bg-white">
      {/* Mobile: wordmark + profile top row */}
      <div class="flex h-14 items-center justify-between px-4 md:px-6">
        <Link to="/" class="hover:opacity-80">
          <span class="font-display text-xl font-black">
            <span class="text-dd-primary">Dou</span>
            <span class="text-dd-accent">Dou</span>
          </span>
        </Link>

        {/* Session code badge — center on tablet+ */}
        <Show when={props.sessionCode}>
          <div class="hidden md:block">
            <SessionCodeBadge code={props.sessionCode!} />
          </div>
        </Show>

        <Profile />
      </div>

      {/* Mobile: session code on second row */}
      <Show when={props.sessionCode}>
        <div class="flex justify-center pb-2 md:hidden">
          <SessionCodeBadge code={props.sessionCode!} />
        </div>
      </Show>
    </header>
  );
}
