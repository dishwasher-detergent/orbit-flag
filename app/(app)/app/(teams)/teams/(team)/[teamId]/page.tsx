import { redirect } from "next/navigation";

import { TeamAdmins } from "@/components/team/team-admins";
import { TeamMembers } from "@/components/team/team-members";
import {
  ADMIN_ROLE,
  MEMBER_ROLE,
  OWNER_ROLE,
} from "@/constants/team.constants";
import { getCurrentUserRoles, getTeamById } from "@/lib/team";

export default async function TeamPage({
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

  return (
    <article className="space-y-6">
      <main className="px-4 space-y-6">
        <TeamAdmins members={data.members ?? []} />
        <TeamMembers
          members={data.members ?? []}
          teamId={data.$id}
          isOwner={isOwner}
          isAdmin={isAdmin}
        />
      </main>
    </article>
  );
}
