import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/shared/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/admin/personal");
  }

  return (
    <main className="flex min-h-dvh bg-porcelain px-5 py-8 text-near-black sm:px-8">
      <section className="mx-auto flex w-full max-w-[720px] flex-col items-center justify-center text-center">
        <Image
          alt="Celeventia"
          className="h-auto w-[230px] sm:w-[280px]"
          height={647}
          priority
          src="/images/logo.png"
          width={2149}
        />
        <p className="mt-5 text-sm font-semibold uppercase text-muted-mauve">
          Tu historia, en un solo lugar.
        </p>
        <h1 className="mt-6 max-w-2xl font-serif text-[2.75rem] font-semibold leading-none text-midnight-navy sm:text-[4rem]">
          Prepara tu invitación de boda con calma
        </h1>
        <p className="mt-5 max-w-xl text-base leading-8 text-midnight-navy/70">
          Accede a tu espacio privado para completar la invitación, preparar
          invitados y revisar confirmaciones.
        </p>
        <Link
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-2xl bg-muted-mauve px-6 text-sm font-semibold text-white transition hover:bg-[#7D5F78]"
          href="/admin/login"
        >
          Iniciar sesión
        </Link>
      </section>
    </main>
  );
}
