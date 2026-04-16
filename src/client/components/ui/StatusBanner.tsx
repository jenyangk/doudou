import type { JSX } from "solid-js";

interface StatusBannerProps {
  variant: "success" | "warning";
  class?: string;
  children: JSX.Element;
}

const variants: Record<string, string> = {
  success: "bg-dd-success/15 text-dd-success border-dd-success/30",
  warning: "bg-dd-accent/20 text-dd-accent-shadow border-dd-accent-shadow/30",
};

export function StatusBanner(props: StatusBannerProps) {
  return (
    <div
      class={`w-full rounded-dd-pill border-2 px-5 py-2.5 text-center text-sm font-display font-bold
              ${variants[props.variant]}
              ${props.class ?? ""}`}
    >
      {props.children}
    </div>
  );
}
