import { For } from "solid-js";
import { buttonPress } from "../../lib/animations";

interface Tab {
  key: string;
  label: string;
}

interface TabSwitcherProps {
  tabs: Tab[];
  active: string;
  onTabChange: (key: string) => void;
  class?: string;
}

export function TabSwitcher(props: TabSwitcherProps) {
  const handleClick = (key: string, e: MouseEvent) => {
    buttonPress(e.currentTarget as HTMLElement);
    props.onTabChange(key);
  };

  return (
    <div class={`inline-flex rounded-dd-pill border-[3px] border-dd-border overflow-hidden ${props.class ?? ""}`}>
      <For each={props.tabs}>
        {(tab) => (
          <button
            class={`px-6 py-2.5 text-sm font-display font-bold transition-colors
                    ${props.active === tab.key
                      ? "bg-dd-primary text-white"
                      : "bg-white text-dd-text hover:bg-dd-surface"
                    }`}
            onClick={(e) => handleClick(tab.key, e)}
          >
            {tab.label}
          </button>
        )}
      </For>
    </div>
  );
}
