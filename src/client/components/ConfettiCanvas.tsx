import { onMount } from "solid-js";
import { launchConfetti } from "../lib/confetti";

export function ConfettiCanvas() {
  let ref!: HTMLDivElement;

  onMount(() => {
    if (ref) launchConfetti(ref);
  });

  return <div ref={ref} />;
}
