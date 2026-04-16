import { onMount, type JSX } from "solid-js";
import { pageEnter } from "../lib/animations";

interface PageTransitionProps {
  children: JSX.Element;
}

export function PageTransition(props: PageTransitionProps) {
  let ref!: HTMLDivElement;

  onMount(() => {
    pageEnter(ref);
  });

  return (
    <div ref={ref} style={{ opacity: 0 }}>
      {props.children}
    </div>
  );
}
