"use client";

import {
  LucideFingerprint,
  LucideShield,
  LucideThumbsUp,
  LucideToggleLeft,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMain() {
  const { teamId } = useParams<{
    teamId: string;
  }>();

  if (!teamId) return null;

  return (
    <>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem key="approvals">
            <SidebarMenuButton asChild tooltip="Approvals">
              <Link href={`/app/teams/${teamId}/approvals`}>
                <LucideThumbsUp />
                <span>Approvals</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>Platform</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem key="flags">
            <SidebarMenuButton asChild tooltip="Flags">
              <Link href={`/app/teams/${teamId}/flags`}>
                <LucideToggleLeft />
                <span>Flags</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem key="contexts">
            <SidebarMenuButton asChild tooltip="Contexts">
              <Link href={`/app/teams/${teamId}/contexts`}>
                <LucideFingerprint />
                <span>Contexts</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem key="whitelist">
            <SidebarMenuButton asChild tooltip="Whitelist">
              <Link href={`/app/teams/${teamId}/whitelist`}>
                <LucideShield />
                <span>Whitelist</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
