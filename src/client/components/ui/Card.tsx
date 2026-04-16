import type { JSX } from "solid-js";

interface CardProps {
  class?: string;
  children: JSX.Element;
}

export function Card(props: CardProps) {
  return (
    <div class={`rounded-dd-card border-[3px] border-dd-border bg-dd-card shadow-dd-card ${props.class ?? ""}`}>
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
    <h3 class={`text-xl font-display font-bold leading-none tracking-tight text-dd-text ${props.class ?? ""}`}>
      {props.children}
    </h3>
  );
}

export function CardDescription(props: CardProps) {
  return (
    <p class={`text-sm font-body text-dd-text-muted ${props.class ?? ""}`}>
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
