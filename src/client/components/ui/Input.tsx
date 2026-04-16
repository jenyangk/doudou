import { splitProps, type JSX } from "solid-js";

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {}

export function Input(props: InputProps) {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <input
      class={`flex h-11 w-full rounded-dd-pill border-[3px] border-dd-border bg-white px-4 py-2
              font-body text-base text-dd-text
              placeholder:text-dd-text-muted
              focus-visible:outline-none focus-visible:border-dd-primary focus-visible:ring-2 focus-visible:ring-dd-primary/20
              disabled:opacity-50 ${local.class ?? ""}`}
      {...rest}
    />
  );
}
