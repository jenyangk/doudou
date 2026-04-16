import { splitProps, type JSX } from "solid-js";
import { buttonPress } from "../../lib/animations";

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const variants: Record<string, string> = {
  primary:
    "bg-dd-primary text-white shadow-dd-btn-primary active:shadow-dd-btn-primary-pressed active:translate-y-[2px]",
  secondary:
    "bg-dd-secondary text-white shadow-dd-btn-secondary active:shadow-dd-btn-secondary-pressed active:translate-y-[2px]",
  accent:
    "bg-dd-accent text-dd-text shadow-dd-btn-accent active:shadow-dd-btn-accent-pressed active:translate-y-[2px]",
  ghost:
    "bg-transparent text-dd-primary border-[3px] border-dd-primary hover:bg-dd-primary/10",
};

const sizes: Record<string, string> = {
  default: "h-11 px-6 py-2 text-base",
  sm: "h-9 px-4 text-sm",
  lg: "h-[3.25rem] px-8 text-lg",
  icon: "h-11 w-11",
};

export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, ["variant", "size", "class", "children", "onClick"]);

  const classes = () =>
    `inline-flex items-center justify-center rounded-dd-pill font-display font-bold
     transition-all duration-150
     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dd-primary focus-visible:ring-offset-2
     disabled:opacity-50 disabled:pointer-events-none
     ${variants[local.variant ?? "primary"]}
     ${sizes[local.size ?? "default"]}
     ${local.class ?? ""}`.trim();

  const handleClick: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent> = (e) => {
    buttonPress(e.currentTarget);
    if (typeof local.onClick === "function") {
      local.onClick(e);
    }
  };

  return (
    <button class={classes()} onClick={handleClick} {...rest}>
      {local.children}
    </button>
  );
}
