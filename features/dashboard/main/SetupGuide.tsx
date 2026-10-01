import { getNextStep } from "./data";
import { SetupStepCard } from "./SetupStepCard";
import type { SetupStep, SetupStepGroup } from "./types";

type SetupGuideProps = {
  steps: SetupStep[];
};

const STEP_GROUPS: Array<{ id: SetupStepGroup; label: string }> = [
  { id: "invitation", label: "Prepara tu invitación" },
  { id: "event", label: "Organiza tu evento" },
  { id: "finish", label: "Finaliza" },
];

export function SetupGuide({ steps }: SetupGuideProps) {
  const nextStep = getNextStep(steps);

  return (
    <section className="rounded-[22px] border border-midnight-navy/10 bg-white/75 px-5 pb-4 pt-5 shadow-[0_12px_34px_rgba(16,42,67,0.025)] sm:px-6 sm:pb-4 sm:pt-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-mauve">
            Guía de configuración
          </p>
          <h2 className="mt-3 font-serif text-[1.9rem] font-semibold leading-tight text-midnight-navy">
            Prepara tu invitación
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-5 text-midnight-navy/65">
          Completa estos pasos para dejar tu invitación lista para compartir con
          tus invitados.
        </p>
      </div>

      <div className="mt-7 space-y-5">
        {STEP_GROUPS.map((group) => {
          const groupSteps = steps.filter((step) => step.group === group.id);

          if (!groupSteps.length) {
            return null;
          }

          return (
            <section key={group.id} aria-labelledby={`${group.id}-heading`}>
              <h3
                className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-midnight-navy/45"
                id={`${group.id}-heading`}
              >
                {group.label}
              </h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {groupSteps.map((step) => (
                  <SetupStepCard
                    key={step.id}
                    isNextStep={step.id === nextStep?.id}
                    step={step}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
