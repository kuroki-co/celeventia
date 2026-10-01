"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { publishInvitation, type PublishInvitationState } from "./action";

type PublishInvitationFormProps = {
  disabled: boolean;
};

const initialState: PublishInvitationState = {};

export function PublishInvitationForm({ disabled }: PublishInvitationFormProps) {
  const [state, formAction] = useActionState(publishInvitation, initialState);

  return (
    <form action={formAction} className="mt-6">
      <SubmitButton disabled={disabled} />
      <p
        aria-live="polite"
        className={[
          "mt-3 min-h-5 text-sm font-semibold",
          state.error ? "text-[#8A3A3A]" : "text-[#24523D]",
        ].join(" ")}
      >
        {state.error ?? state.success ?? ""}
      </p>
    </form>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-muted-mauve px-5 text-sm font-semibold text-white transition-colors hover:bg-[#7D5F78] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-mauve disabled:cursor-not-allowed disabled:bg-muted-mauve/40"
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? "Publicando..." : "Publicar invitacion"}
    </button>
  );
}
