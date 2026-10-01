"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";

import { createClient } from "@/shared/supabase/client";

import { loginSchema, type LoginInput } from "./schema";

type FieldErrors = Partial<Record<keyof LoginInput, string>>;

const INVALID_CREDENTIALS_MESSAGE = "Correo o contraseña incorrectos.";
const UNEXPECTED_ERROR_MESSAGE =
  "No pudimos iniciar sesión en este momento. Inténtalo nuevamente.";
const inputClassName =
  "h-[52px] w-full rounded-2xl border border-midnight-navy/15 bg-white px-5 text-[15px] text-near-black outline-none transition-[border-color,box-shadow,background-color,color] duration-200 placeholder:text-midnight-navy/35 hover:border-midnight-navy/30 focus:border-muted-mauve focus:ring-4 focus:ring-muted-mauve/15 disabled:cursor-not-allowed disabled:border-midnight-navy/10 disabled:bg-porcelain/75 disabled:text-midnight-navy/45 aria-[invalid=true]:border-[#9F3A4D] aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-[#9F3A4D]/10";

export function LoginForm() {
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();
  const [values, setValues] = useState<LoginInput>({
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setFormError(null);
    setFieldErrors({});

    const result = loginSchema.safeParse(values);

    if (!result.success) {
      const nextErrors: FieldErrors = {};

      result.error.issues.forEach((issue) => {
        const field = issue.path[0];

        if (field === "email" || field === "password") {
          nextErrors[field] = issue.message;
        }
      });

      setFieldErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword(result.data);

      if (error) {
        setFormError(
          error.status === 400 || error.status === 422
            ? INVALID_CREDENTIALS_MESSAGE
            : UNEXPECTED_ERROR_MESSAGE,
        );
        return;
      }

      router.replace("/admin/personal");
      router.refresh();
    } catch {
      setFormError(UNEXPECTED_ERROR_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <div className="space-y-2">
        <label
          className="block text-sm font-semibold text-midnight-navy"
          htmlFor={emailId}
        >
          Correo electrónico
        </label>
        <input
          aria-describedby={fieldErrors.email ? `${emailId}-error` : undefined}
          aria-invalid={Boolean(fieldErrors.email)}
          autoComplete="email"
          className={inputClassName}
          disabled={isSubmitting}
          id={emailId}
          inputMode="email"
          name="email"
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              email: event.target.value,
            }))
          }
          placeholder="nombre@correo.com"
          type="email"
          value={values.email}
        />
        {fieldErrors.email ? (
          <p className="text-sm text-[#7F1D2D]" id={`${emailId}-error`}>
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          className="block text-sm font-semibold text-midnight-navy"
          htmlFor={passwordId}
        >
          Contraseña
        </label>
        <input
          aria-describedby={
            fieldErrors.password ? `${passwordId}-error` : undefined
          }
          aria-invalid={Boolean(fieldErrors.password)}
          autoComplete="current-password"
          className={inputClassName}
          disabled={isSubmitting}
          id={passwordId}
          name="password"
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              password: event.target.value,
            }))
          }
          placeholder="Tu contraseña"
          type="password"
          value={values.password}
        />
        {fieldErrors.password ? (
          <p className="text-sm text-[#7F1D2D]" id={`${passwordId}-error`}>
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      {formError ? (
        <p
          aria-live="polite"
          className="rounded-2xl border border-[#9F3A4D]/16 bg-[#9F3A4D]/5 px-4 py-3 text-sm leading-6 text-[#7F1D2D]"
        >
          {formError}
        </p>
      ) : null}

      <div className="pt-1">
        <button
          aria-busy={isSubmitting}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-muted-mauve px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(142,108,136,0.18)] transition-[background-color,box-shadow] duration-200 hover:bg-[#7D5F78] hover:shadow-[0_16px_34px_rgba(142,108,136,0.2)] active:bg-[#73566E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-muted-mauve disabled:cursor-not-allowed disabled:bg-muted-mauve/55 disabled:shadow-none"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <span
                aria-hidden="true"
                className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
              <span>Iniciando sesión...</span>
            </>
          ) : (
            "Iniciar sesión"
          )}
        </button>
      </div>

      <div className="-mt-1 text-center">
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-xl px-3 text-sm font-medium text-midnight-navy/78 no-underline transition-colors duration-200 hover:text-muted-mauve hover:underline hover:decoration-warm-sand hover:decoration-2 hover:underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-mauve"
          href="/admin/recuperar-contrasena"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
    </form>
  );
}
