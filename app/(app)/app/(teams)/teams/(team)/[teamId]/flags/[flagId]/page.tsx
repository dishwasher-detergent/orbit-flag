import { notFound, redirect } from "next/navigation";

import { EditFeatureFlagForm } from "@/components/feature-flag/edit-feature-flag-form";
import { getFeatureFlagById } from "@/lib/feature-flag";

interface EditFeatureFlagPageProps {
  params: {
    teamId: string;
    flagId: string;
  };
}

export default async function EditFeatureFlagPage({
  params,
}: EditFeatureFlagPageProps) {
  const { teamId, flagId } = params;

  const result = await getFeatureFlagById(flagId);

  if (!result.success || !result.data) {
    notFound();
  }

  const flag = result.data;

  if (flag.teamId !== teamId) {
    redirect(`/app/teams/${flag.teamId}/flags/${flagId}`);
  }

  return <EditFeatureFlagForm flag={flag} teamId={teamId} />;
}
