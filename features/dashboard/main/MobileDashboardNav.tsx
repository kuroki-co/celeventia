import Image from "next/image";
import Link from "next/link";

type MobileDashboardNavProps = {
  activeHref?: string;
  invitationHref: string;
};

const mobileNavItems = [
  { label: "Resumen", href: "/admin/personal" },
  { label: "Invitación", href: "/admin/personal/invitacion/preview" },
  { label: "Invitados", href: "/admin/personal/invitados" },
  { label: "Confirmaciones", href: "/admin/personal/confirmaciones" },
];

export function MobileDashboardNav({
  activeHref = "/admin/personal",
  invitationHref,
}: MobileDashboardNavProps) {
  return (
    <header className="border-b border-midnight-navy/10 bg-white px-4 py-4 lg:hidden">
      <div className="flex items-center justify-between gap-4">
        <Link
          className="rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-muted-mauve"
          href="/admin/personal"
        >
          <Image
            alt="Celeventia"
            className="h-auto w-[148px]"
            height={647}
            preload
            src="/images/logo.png"
            width={2149}
          />
        </Link>
        <Link
          className="inline-flex min-h-10 items-center rounded-2xl border border-muted-mauve/20 px-3 text-sm font-semibold text-muted-mauve"
          href={invitationHref}
        >
          Vista previa
        </Link>
      </div>

      <nav
        aria-label="Navegación principal"
        className="mt-4 flex gap-2 overflow-x-auto pb-1"
      >
        {mobileNavItems.map((item) => {
          const active = item.href === activeHref;

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={[
                "whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted-mauve",
                active
                  ? "bg-muted-mauve/10 text-muted-mauve"
                  : "bg-porcelain text-midnight-navy/70",
              ].join(" ")}
              href={item.href}
              key={item.label}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
