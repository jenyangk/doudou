import { onMount, type JSX } from "solid-js";
import { badgeAppear } from "../../lib/animations";

interface BadgeProps {
  variant?: "primary" | "accent" | "secondary" | "success";
  class?: string;
  animate?: boolean;
  children: JSX.Element;
}

const variants: Record<string, string> = {
  primary: "bg-dd-primary/15 text-dd-primary",
  accent: "bg-dd-accent/25 text-dd-accent-shadow",
  secondary: "bg-dd-secondary/15 text-dd-secondary",
  success: "bg-dd-success/15 text-dd-success",
};

export function Badge(props: BadgeProps) {
  let ref!: HTMLSpanElement;

  onMount(() => {
    if (props.animate) badgeAppear(ref);
  });

  return (
    <span
      ref={ref}
      class={`inline-flex items-center rounded-dd-pill px-3 py-1 text-sm font-display font-bold
              ${variants[props.variant ?? "primary"]}
              ${props.class ?? ""}`}
    >
      {props.children}
    </span>
  );
}
