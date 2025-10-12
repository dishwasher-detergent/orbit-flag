import { CreateFeatureFlagForm } from "@/components/feature-flag/create-feature-flag-form";
import { PageHeader } from "@/components/ui/page-header";
import { Plus } from "lucide-react";

interface CreateFeatureFlagPageProps {
  params: {
    teamId: string;
  };
}

export default async function CreateFeatureFlagPage({
  params,
}: CreateFeatureFlagPageProps) {
  const { teamId } = params;

  return (
    <>
      <PageHeader
        title="Create Feature Flag"
        description="Set up a new feature flag with targeting rules."
        icon={Plus}
      />
      <CreateFeatureFlagForm teamId={teamId} />
    </>
  );
}
