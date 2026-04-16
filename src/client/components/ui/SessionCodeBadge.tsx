import { copyBounce } from "../../lib/animations";
import toast from "solid-toast";

interface SessionCodeBadgeProps {
  code: string;
  class?: string;
}

export function SessionCodeBadge(props: SessionCodeBadgeProps) {
  let ref!: HTMLButtonElement;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(props.code);
      copyBounce(ref);
      toast.success("Code copied!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <button
      ref={ref}
      onClick={handleCopy}
      class={`inline-flex items-center gap-2 rounded-dd-pill border-[3px] border-dd-border bg-white
              px-5 py-1.5 font-display font-bold text-lg tracking-[4px] text-dd-text
              hover:bg-dd-surface transition-colors cursor-pointer
              ${props.class ?? ""}`}
      title="Click to copy session code"
    >
      {props.code}
      <span class="text-sm tracking-normal text-dd-text-muted">📋</span>
    </button>
  );
}
