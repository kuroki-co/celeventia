import type { Metadata } from "next";
import Image from "next/image";

import { RecoverPasswordForm } from "@/features/auth/recover-password/RecoverPasswordForm";

export const metadata: Metadata = {
  title: "Recuperar contrasena | Celeventia",
  description: "Solicita un enlace para recuperar el acceso a Celeventia.",
};

export default function RecoverPasswordPage() {
  return (
    <main className="relative flex min-h-dvh overflow-hidden bg-porcelain px-5 py-6 text-near-black sm:px-8 sm:py-9">
      <section className="relative mx-auto flex w-full max-w-[524px] flex-col items-center justify-center">
        <Image
          alt="Celeventia"
          className="mx-auto h-auto w-[218px] sm:w-[252px]"
          height={647}
          preload
          src="/images/logo.png"
          width={2149}
        />
        <div className="mt-6 w-full rounded-[22px] border border-midnight-navy/10 bg-white p-6 shadow-[0_34px_96px_rgba(16,42,67,0.05)] sm:px-10 sm:py-8">
          <p className="text-xs font-semibold uppercase text-muted-mauve">
            Recuperar acceso
          </p>
          <h1 className="mt-2 font-serif text-[2.35rem] font-semibold leading-tight text-midnight-navy">
            Te enviamos un enlace
          </h1>
          <p className="mt-2 text-sm leading-6 text-midnight-navy/70">
            Ingresa tu correo y, si pertenece a una cuenta, recibiras un enlace
            seguro para cambiar tu contrasena.
          </p>
          <div className="mt-6">
            <RecoverPasswordForm />
          </div>
        </div>
      </section>
    </main>
  );
}
