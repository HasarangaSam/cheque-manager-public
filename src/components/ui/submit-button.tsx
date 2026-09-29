"use client";

/**
 * SubmitButton — reads pending state from the nearest parent <form> via useFormStatus.
 *
 * Why useFormStatus instead of passing isPending as a prop?
 * - No prop drilling needed from the form parent.
 * - Decoupled: this button works inside ANY server-action form.
 * - The React 19 / Next.js 15 idiomatic pattern for form submit states.
 *
 * Must be rendered as a child of a <form> to receive the form's status.
 */

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

type SubmitButtonProps = {
  /** Label shown when the form is idle. */
  label: string;
  /** Label shown while the form action is in-flight. Defaults to "Saving…" */
  pendingLabel?: string;
  /** Additional Tailwind classes to append to the button. */
  className?: string;
  /** Optional inline styles. */
  style?: React.CSSProperties;
};

export default function SubmitButton({
  label,
  pendingLabel = "Saving…",
  className = "",
  style,
}: SubmitButtonProps) {
  // useFormStatus subscribes to the nearest ancestor <form>'s submission state.
  // This CANNOT be called in the same component that renders the <form> —
  // it must be in a child component.
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      style={style}
      className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? pendingLabel : label}
    </button>
  );
}
