import Image from "next/image";
import Link from "next/link";

import { signOut } from "@/features/auth/logout/action";

type DashboardSidebarProps = {
  activeHref?: string;
  coupleName: string;
  dateLabel: string;
};

const navItems = [
  { label: "Resumen", href: "/admin/personal" },
  { label: "Invitación", href: "/admin/personal/invitacion/preview" },
  { label: "Invitados", href: "/admin/personal/invitados" },
  { label: "Confirmaciones", href: "/admin/personal/confirmaciones" },
];

export function DashboardSidebar({
  activeHref = "/admin/personal",
  coupleName,
  dateLabel,
}: DashboardSidebarProps) {
  return (
    <aside className="hidden min-h-dvh w-[250px] shrink-0 border-r border-midnight-navy/10 bg-white px-5 py-7 lg:sticky lg:top-0 lg:flex lg:flex-col xl:w-[280px] xl:px-6">
      <Link
        className="inline-flex w-fit rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-muted-mauve"
        href="/admin/personal"
      >
        <Image
          alt="Celeventia"
          className="h-auto w-[172px]"
          height={647}
          preload
          src="/images/logo.png"
          width={2149}
        />
      </Link>

      <nav aria-label="Navegación principal" className="mt-10 space-y-1">
        {navItems.map((item) => {
          const active = item.href === activeHref;

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={[
                "relative flex min-h-11 items-center rounded-2xl px-4 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-mauve",
                active
                  ? "bg-muted-mauve/10 font-semibold text-muted-mauve"
                  : "font-medium text-midnight-navy/72 hover:bg-porcelain hover:text-midnight-navy",
              ].join(" ")}
              href={item.href}
              key={item.label}
            >
              <span
                aria-hidden="true"
                className={[
                  "absolute left-0 h-5 w-0.5 rounded-full",
                  active ? "bg-muted-mauve" : "bg-transparent",
                ].join(" ")}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-midnight-navy/10 pt-6">
        <p className="text-sm font-semibold text-midnight-navy">{coupleName}</p>
        <p className="mt-1 text-xs font-medium text-midnight-navy/52">
          {dateLabel}
        </p>
        <form action={signOut} className="mt-3">
          <button
            className="min-h-10 rounded-xl text-sm font-medium text-midnight-navy/62 transition-colors hover:text-muted-mauve focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-mauve"
            type="submit"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
