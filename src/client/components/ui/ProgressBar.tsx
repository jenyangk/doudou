import { createEffect, on } from "solid-js";
import { progressFill } from "../../lib/animations";

interface ProgressBarProps {
  percent: number;
  class?: string;
}

export function ProgressBar(props: ProgressBarProps) {
  let fillRef!: HTMLDivElement;

  createEffect(on(() => props.percent, (pct) => {
    if (fillRef) progressFill(fillRef, pct);
  }));

  return (
    <div class={`w-full h-3 rounded-dd-pill border-2 border-dd-border bg-white overflow-hidden ${props.class ?? ""}`}>
      <div
        ref={fillRef}
        class="h-full bg-dd-primary rounded-dd-pill"
        style={{ width: "0%" }}
      />
    </div>
  );
}
