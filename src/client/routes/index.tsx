import { createSignal } from "solid-js";
import { CreateSession } from "../components/CreateSession";
import { JoinSession } from "../components/JoinSession";

export default function Home() {
  const [tab, setTab] = createSignal<"join" | "create">("join");

  return (
    <div class="py-8 max-w-sm mx-auto px-4">
      <div class="grid grid-cols-2 mb-4 rounded-lg border border-gray-200 overflow-hidden">
        <button
          class={`py-2 text-sm font-medium transition-colors ${
            tab() === "create"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
          onClick={() => setTab("create")}
        >
          Create Session
        </button>
        <button
          class={`py-2 text-sm font-medium transition-colors ${
            tab() === "join"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
          onClick={() => setTab("join")}
        >
          Join Session
        </button>
      </div>

      {tab() === "create" ? <CreateSession /> : <JoinSession />}
    </div>
  );
}
