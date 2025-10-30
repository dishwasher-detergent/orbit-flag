import { LucideCode2 } from "lucide-react";
import Link from "next/link";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface NavDocsProps {
  teamId: string;
}

export function NavDocs({ teamId }: NavDocsProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Documentation</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem key="documentation">
          <SidebarMenuButton asChild tooltip="Documentation">
            <Link href={`/app/teams/${teamId}/documentation`}>
              <LucideCode2 />
              <span>How To Use</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
