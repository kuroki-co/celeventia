import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/login/LoginForm";
import { createClient } from "@/shared/supabase/server";

export const metadata: Metadata = {
  title: "Iniciar sesión | Celeventia",
  description: "Accede a tu panel administrativo de Celeventia.",
};

export default async function AdminLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/admin/personal");
  }

  return (
    <main className="relative flex min-h-dvh overflow-hidden bg-porcelain px-5 py-6 text-near-black sm:px-8 sm:py-9">
      <Image
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-16 hidden h-auto w-80 opacity-[0.024] lg:block"
        height={662}
        src="/images/logo-secundario.png"
        width={812}
      />
      <Image
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-24 hidden h-auto w-72 opacity-[0.026] sm:block lg:w-80"
        height={662}
        src="/images/logo-secundario.png"
        width={812}
      />

      <section className="relative mx-auto flex w-full max-w-[524px] flex-col items-center justify-center lg:-translate-y-2">
        <div className="w-full text-center">
          <Image
            alt="Celeventia"
            className="mx-auto h-auto w-[218px] sm:w-[252px]"
            height={647}
            preload
            src="/images/logo.png"
            width={2149}
          />
          <p className="mt-4 text-sm font-medium uppercase text-muted-mauve">
            Tu historia, en un solo lugar.
          </p>
          <div className="mx-auto mt-5 h-px w-20 bg-warm-sand/65" />
          <h1 className="mx-auto mt-6 max-w-[380px] font-serif text-[2.28rem] font-semibold leading-[1.04] text-midnight-navy sm:text-[2.9rem]">
            Tu celebración continúa aquí
          </h1>
          <p className="mx-auto mt-3.5 max-w-[370px] text-[15px] leading-7 text-midnight-navy/70">
            Accede a tu espacio privado para seguir preparando cada detalle con
            calma.
          </p>
        </div>

        <div className="mt-5 w-full rounded-[22px] border border-midnight-navy/10 bg-white p-6 shadow-[0_34px_96px_rgba(16,42,67,0.05)] sm:px-10 sm:py-8">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
