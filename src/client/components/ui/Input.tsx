import { splitProps, type JSX } from "solid-js";

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {}

export function Input(props: InputProps) {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <input
      class={`flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm
              placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-gray-400 disabled:opacity-50 ${local.class ?? ""}`}
      {...rest}
    />
  );
}
