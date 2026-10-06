"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { z } from "zod";

import { createClient } from "@/shared/supabase/client";

const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "Usa al menos 8 caracteres."),
    passwordConfirmation: z.string().min(1, "Confirma tu contrasena."),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    message: "Las contrasenas no coinciden.",
    path: ["passwordConfirmation"],
  });

const inputClassName =
  "h-[52px] w-full rounded-2xl border border-midnight-navy/15 bg-white px-5 text-[15px] text-near-black outline-none transition-[border-color,box-shadow,background-color,color] duration-200 placeholder:text-midnight-navy/35 hover:border-midnight-navy/30 focus:border-muted-mauve focus:ring-4 focus:ring-muted-mauve/15 disabled:cursor-not-allowed disabled:border-midnight-navy/10 disabled:bg-porcelain/75 disabled:text-midnight-navy/45 aria-[invalid=true]:border-[#9F3A4D] aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-[#9F3A4D]/10";

export function UpdatePasswordForm() {
  const router = useRouter();
  const passwordId = useId();
  const confirmationId = useId();
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
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

    const parsed = updatePasswordSchema.safeParse({
      password,
      passwordConfirmation,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa la contrasena.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: parsed.data.password,
      });

      if (error) {
        setError(
          "No pudimos actualizar la contrasena. Abre nuevamente el enlace de recuperacion o solicita otro.",
        );
        return;
      }

      setSuccess("Contrasena actualizada. Te llevaremos al panel.");
      router.replace("/admin/personal");
      router.refresh();
    } catch {
      setError(
        "No pudimos actualizar la contrasena. Revisa tu conexion e intentalo nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <label className="block space-y-2" htmlFor={passwordId}>
        <span className="block text-sm font-semibold text-midnight-navy">
          Nueva contrasena
        </span>
        <input
          aria-invalid={Boolean(error)}
          autoComplete="new-password"
          className={inputClassName}
          disabled={isSubmitting}
          id={passwordId}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
      </label>

      <label className="block space-y-2" htmlFor={confirmationId}>
        <span className="block text-sm font-semibold text-midnight-navy">
          Confirmar contrasena
        </span>
        <input
          aria-invalid={Boolean(error)}
          autoComplete="new-password"
          className={inputClassName}
          disabled={isSubmitting}
          id={confirmationId}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
          type="password"
          value={passwordConfirmation}
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
        {isSubmitting ? "Guardando..." : "Actualizar contrasena"}
      </button>

      <Link
        className="inline-flex min-h-10 items-center justify-center rounded-xl px-3 text-sm font-semibold text-midnight-navy/78 hover:text-muted-mauve"
        href="/admin/login"
      >
        Volver a iniciar sesión
      </Link>
    </form>
  );
}
