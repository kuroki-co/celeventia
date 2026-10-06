"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { z } from "zod";

import { createClient } from "@/shared/supabase/client";

const recoverPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Ingresa tu correo electronico.")
    .email("Ingresa un correo electronico valido."),
});

const inputClassName =
  "h-[52px] w-full rounded-2xl border border-midnight-navy/15 bg-white px-5 text-[15px] text-near-black outline-none transition-[border-color,box-shadow,background-color,color] duration-200 placeholder:text-midnight-navy/35 hover:border-midnight-navy/30 focus:border-muted-mauve focus:ring-4 focus:ring-muted-mauve/15 disabled:cursor-not-allowed disabled:border-midnight-navy/10 disabled:bg-porcelain/75 disabled:text-midnight-navy/45 aria-[invalid=true]:border-[#9F3A4D] aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-[#9F3A4D]/10";

export function RecoverPasswordForm() {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError("");
    setSuccess("");

    const parsed = recoverPasswordSchema.safeParse({ email });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa el correo.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/admin/actualizar-contrasena`;
      const { error } = await supabase.auth.resetPasswordForEmail(
        parsed.data.email,
        { redirectTo },
      );

      if (error) {
        setError(
          "No pudimos enviar el correo de recuperacion. Revisa tu conexion e intentalo nuevamente.",
        );
        return;
      }

      setSuccess(
        "Si el correo pertenece a una cuenta, recibiras un enlace para cambiar tu contrasena.",
      );
    } catch {
      setError(
        "No pudimos enviar el correo de recuperacion. Revisa tu conexion e intentalo nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <label className="block space-y-2" htmlFor={emailId}>
        <span className="block text-sm font-semibold text-midnight-navy">
          Correo electronico
        </span>
        <input
          aria-invalid={Boolean(error)}
          autoComplete="email"
          className={inputClassName}
          disabled={isSubmitting}
          id={emailId}
          inputMode="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nombre@correo.com"
          type="email"
          value={email}
        />
      </label>

      {error || success ? (
        <p
          aria-live="polite"
          className={[
            "rounded-2xl border px-4 py-3 text-sm leading-6",
            error
              ? "border-[#9F3A4D]/16 bg-[#9F3A4D]/5 text-[#7F1D2D]"
              : "border-[#24523D]/15 bg-[#24523D]/5 text-[#24523D]",
          ].join(" ")}
        >
          {error || success}
        </p>
      ) : null}

      <button
        aria-busy={isSubmitting}
        className="flex h-[52px] w-full items-center justify-center rounded-2xl bg-muted-mauve px-5 text-sm font-semibold text-white transition hover:bg-[#7D5F78] disabled:cursor-not-allowed disabled:bg-muted-mauve/55"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Enviando..." : "Enviar enlace de recuperacion"}
      </button>

      <Link
        className="inline-flex min-h-10 items-center justify-center rounded-xl px-3 text-sm font-semibold text-midnight-navy/78 hover:text-muted-mauve"
        href="/admin/login"
      >
        Volver a iniciar sesion
      </Link>
    </form>
  );
}
