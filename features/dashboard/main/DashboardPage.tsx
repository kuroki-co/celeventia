import { DashboardSidebar } from "./DashboardSidebar";
import { EventHeader } from "./EventHeader";
import { getNextStep, getSetupProgress } from "./data";
import { MobileDashboardNav } from "./MobileDashboardNav";
import { SetupGuide } from "./SetupGuide";
import type { DashboardData } from "./types";

type DashboardPageProps = {
  data: DashboardData;
};

export function DashboardPage({ data }: DashboardPageProps) {
  const progress = getSetupProgress(data.setupSteps);
  const nextStep = getNextStep(data.setupSteps);
  const invitationHref =
    data.invitation.status === "published" && data.invitation.publicHref
      ? data.invitation.publicHref
      : data.invitation.previewHref;

  return (
    <div className="min-h-dvh bg-porcelain text-near-black lg:flex">
      <DashboardSidebar
        coupleName={data.event.coupleName}
        dateLabel={data.event.dateLabel}
      />
      <div className="min-w-0 flex-1">
        <MobileDashboardNav invitationHref={invitationHref} />
        <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:px-7 lg:py-5">
          <EventHeader
            event={data.event}
            invitation={data.invitation}
            nextStep={nextStep}
            progress={progress}
          />
          <SetupGuide steps={data.setupSteps} />
        </main>
      </div>
    </div>
  );
}
