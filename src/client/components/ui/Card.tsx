import type { JSX } from "solid-js";

interface CardProps {
  class?: string;
  children: JSX.Element;
}

export function Card(props: CardProps) {
  return (
    <div class={`rounded-lg border border-gray-200 bg-white shadow-sm ${props.class ?? ""}`}>
      {props.children}
    </div>
  );
}

export function CardHeader(props: CardProps) {
  return (
    <div class={`flex flex-col space-y-1.5 p-6 ${props.class ?? ""}`}>
      {props.children}
    </div>
  );
}

export function CardTitle(props: CardProps) {
  return (
    <h3 class={`text-xl font-semibold leading-none tracking-tight ${props.class ?? ""}`}>
      {props.children}
    </h3>
  );
}

export function CardDescription(props: CardProps) {
  return (
    <p class={`text-sm text-gray-500 ${props.class ?? ""}`}>
      {props.children}
    </p>
  );
}

export function CardContent(props: CardProps) {
  return (
    <div class={`p-6 pt-0 ${props.class ?? ""}`}>
      {props.children}
    </div>
  );
}

export function CardFooter(props: CardProps) {
  return (
    <div class={`flex items-center p-6 pt-0 ${props.class ?? ""}`}>
      {props.children}
    </div>
  );
}
