import { Shield } from "lucide-react";
import { notFound } from "next/navigation";

import { WhitelistForm } from "@/components/team/whitelist-form";
import { PageHeader } from "@/components/ui/page-header";
import { getTeamById } from "@/lib/team";

export default async function WhitelistPage({
  params,
}: {
  params: Promise<{ teamId: string; flagId: string }>;
}) {
  const { teamId } = await params;

  const result = await getTeamById(teamId);

  if (!result.success || !result.data) {
    notFound();
  }

  const team = result.data;

  return (
    <>
      <PageHeader
        icon={Shield}
        title="Domain Whitelist"
        description="Manage which domains can access your feature flags via the API"
      />
      <WhitelistForm team={team} />
    </>
  );
}
