"use client";

import { useParams } from "next/navigation";
import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavTeam } from "@/components/team/nav-team";
import { TeamSwitcher } from "@/components/team/nav-team-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/user/nav-user";
import { useTeamData } from "@/hooks/useTeamData";
import { useUserData } from "@/hooks/useUserData";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { teamId } = useParams<{
    teamId: string;
  }>();

  const { teams, loading: teamLoading, refetchTeams } = useTeamData();
  const { user, roles, loading } = useUserData(teamId);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher
          currentTeamId={teamId}
          data={teams}
          loading={teamLoading}
          refetchTeams={refetchTeams}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain userRoles={roles} />
        {teamId && <NavTeam teamId={teamId} />}
        <div className="mt-auto p-2">
          <ThemeToggle />
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser data={user} loading={loading} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
