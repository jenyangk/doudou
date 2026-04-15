import { splitProps, type JSX } from "solid-js";

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const variants: Record<string, string> = {
  default: "bg-gray-900 text-white hover:bg-gray-800",
  ghost: "hover:bg-gray-100",
  outline: "border border-gray-200 hover:bg-gray-100",
  destructive: "bg-red-500 text-white hover:bg-red-600",
};

const sizes: Record<string, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-8 px-3 text-sm",
  lg: "h-12 px-8 text-lg",
  icon: "h-10 w-10",
};

export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, ["variant", "size", "class", "children"]);

  const classes = () =>
    `inline-flex items-center justify-center rounded-md font-medium transition-colors
     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400
     disabled:opacity-50 disabled:pointer-events-none
     ${variants[local.variant ?? "default"]}
     ${sizes[local.size ?? "default"]}
     ${local.class ?? ""}`.trim();

  return (
    <button class={classes()} {...rest}>
      {local.children}
    </button>
  );
}
