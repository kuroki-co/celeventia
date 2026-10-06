import Link from "next/link";
import {
  CalendarHeart,
  Eye,
  FileText,
  Image,
  Palette,
  Send,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  getStepStatusLabel,
  getStepStatusMark,
  getStepStatusToneClassName,
} from "./status";
import type { SetupStep, SetupStepIcon } from "./types";

type SetupStepCardProps = {
  isNextStep?: boolean;
  step: SetupStep;
};

export function SetupStepCard({
  isNextStep = false,
  step,
}: SetupStepCardProps) {
  const statusLabel = getStepStatusLabel(step.status);

  return (
    <Link
      aria-label={`${step.title}. ${statusLabel}. ${step.ctaLabel}`}
      className={[
        "group relative flex min-h-[132px] flex-col rounded-[18px] border bg-white p-4 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-muted-mauve sm:p-4",
        isNextStep
          ? "border-muted-mauve/24 bg-muted-mauve/[0.045]"
          : "border-midnight-navy/10 hover:border-muted-mauve/26 hover:bg-warm-sand/[0.07]",
      ].join(" ")}
      href={step.href}
    >
      {isNextStep ? (
        <span
          aria-hidden="true"
          className="absolute inset-y-4 left-0 w-0.5 rounded-full bg-muted-mauve"
        />
      ) : null}

      <span className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={[
            "flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors",
            isNextStep
              ? "border-muted-mauve/18 bg-muted-mauve/8 text-muted-mauve"
              : "border-midnight-navy/10 bg-porcelain text-midnight-navy/72 group-hover:border-muted-mauve/24 group-hover:text-muted-mauve",
          ].join(" ")}
        >
          <StepIcon icon={step.icon} />
        </span>
        <span className="block text-base font-semibold leading-6 text-midnight-navy group-hover:text-muted-mauve">
          {step.title}
          {step.optional ? (
            <span className="ml-2 align-middle text-xs font-semibold text-midnight-navy/45">
              Opcional
            </span>
          ) : null}
        </span>
      </span>

      <span className="mt-2 block pl-12 text-sm leading-5 text-midnight-navy/62">
        {step.detail ?? step.description}
      </span>

      <span className="mt-auto flex items-end justify-between gap-4 pt-3">
        <span
          className={[
            "flex items-center gap-2 text-sm font-semibold",
            getStepStatusToneClassName(step.status),
          ].join(" ")}
        >
          <span aria-hidden="true" className="text-base leading-none">
            {getStepStatusMark(step.status)}
          </span>
          {statusLabel}
        </span>

        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-full text-lg text-midnight-navy/42 transition-colors group-hover:text-muted-mauve"
        >
          →
        </span>
      </span>
    </Link>
  );
}

function StepIcon({ icon }: { icon: SetupStepIcon }) {
  const icons: Record<SetupStepIcon, LucideIcon> = {
    calendar: CalendarHeart,
    document: FileText,
    palette: Palette,
    image: Image,
    users: Users,
    eye: Eye,
    send: Send,
  };
  const Icon = icons[icon];

  return <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />;
}
