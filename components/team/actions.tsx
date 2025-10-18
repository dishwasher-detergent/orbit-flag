import { TeamData } from "@/interfaces/team.interface";
import { LucideMoreVertical } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { DeleteTeam } from "./delete";
import { EditTeam } from "./edit";
import { InviteTeam } from "./invite";
import { LeaveTeam } from "./leave";

interface TeamActionsProps {
  data: TeamData;
  isOwner: boolean;
  isAdmin: boolean;
}

export function TeamActions({ data, isOwner, isAdmin }: TeamActionsProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="icon">
          <LucideMoreVertical />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-40 p-1 flex flex-col gap-1"
        side="bottom"
        align="end"
      >
        {!isOwner && <LeaveTeam team={data} />}
        {(isAdmin || isOwner) && <InviteTeam team={data} />}
        {(isOwner || isAdmin) && <EditTeam team={data} />}
        {isOwner && <DeleteTeam team={data} />}
      </PopoverContent>
    </Popover>
  );
}
