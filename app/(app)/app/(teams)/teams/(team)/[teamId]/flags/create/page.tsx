import { CreateFeatureFlagForm } from "@/components/feature-flag/create-feature-flag-form";

interface CreateFeatureFlagPageProps {
  params: {
    teamId: string;
  };
}

export default async function CreateFeatureFlagPage({
  params,
}: CreateFeatureFlagPageProps) {
  const { teamId } = params;

  return <CreateFeatureFlagForm teamId={teamId} />;
}
