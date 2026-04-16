import { createSignal } from "solid-js";
import { CreateSession } from "../components/CreateSession";
import { JoinSession } from "../components/JoinSession";
import { MySessionsList } from "../components/MySessionsList";
import { TabSwitcher } from "../components/ui/TabSwitcher";
import { PageTransition } from "../components/PageTransition";

export default function Home() {
  const [tab, setTab] = createSignal<string>("join");

  return (
    <PageTransition>
      <div class="py-8 max-w-sm mx-auto px-4">
        <TabSwitcher
          tabs={[
            { key: "create", label: "Create Session" },
            { key: "join", label: "Join Session" },
          ]}
          active={tab()}
          onTabChange={setTab}
          class="w-full mb-6"
        />

        {tab() === "create" ? <CreateSession /> : <JoinSession />}

        <MySessionsList />
      </div>
    </PageTransition>
  );
}
