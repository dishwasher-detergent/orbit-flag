import { notFound, redirect } from "next/navigation";

import { EditFeatureFlagForm } from "@/components/feature-flag/edit-feature-flag-form";
import { PageHeader } from "@/components/ui/page-header";
import { getFeatureFlagById } from "@/lib/feature-flag";
import { Pencil } from "lucide-react";

export default async function EditFeatureFlagPage({
  params,
}: {
  params: Promise<{ teamId: string; flagId: string }>;
}) {
  const { teamId, flagId } = await params;

  const result = await getFeatureFlagById(flagId);

  if (!result.success || !result.data) {
    notFound();
  }

  const flag = result.data;

  if (flag.teamId !== teamId) {
    redirect(`/app/teams/${flag.teamId}/flags/${flagId}`);
  }

  return (
    <>
      <PageHeader
        title="Edit Feature Flag"
        description="Modify the settings for this feature flag."
        icon={Pencil}
      />
      <EditFeatureFlagForm flag={flag} teamId={teamId} />
    </>
  );
}
