import { LucideSettings } from "lucide-react";
import { redirect } from "next/navigation";

import { TeamActions } from "@/components/team/actions";
import { TeamMembers } from "@/components/team/members";
import { PageHeader } from "@/components/ui/page-header";
import {
  ADMIN_ROLE,
  MEMBER_ROLE,
  OWNER_ROLE,
} from "@/constants/team.constants";
import { setLastVisitedTeam } from "@/lib/auth";
import { getCurrentUserRoles, getTeamById } from "@/lib/team";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const { data, success } = await getTeamById(teamId);

  if (!success || !data) {
    redirect("/app");
  }

  const { data: roles } = await getCurrentUserRoles(teamId);

  const isOwner = roles!.includes(OWNER_ROLE);
  const isAdmin = roles!.includes(ADMIN_ROLE);
  const isMember = roles!.includes(MEMBER_ROLE);

  if (!isMember) {
    await setLastVisitedTeam(null);
    redirect("/app");
  }

  return (
    <>
      <PageHeader
        icon={LucideSettings}
        title={data.name}
        description={data.about || "Team Settings"}
      >
        {isMember && (
          <TeamActions data={data} isOwner={isOwner} isAdmin={isAdmin} />
        )}
      </PageHeader>
      <TeamMembers
        members={data.members ?? []}
        teamId={data.$id}
        isOwner={isOwner}
        isAdmin={isAdmin}
      />
    </>
  );
}
