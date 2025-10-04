"use client";

import { LucideLogOut, LucideUser, LucideUsers } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@/interfaces/user.interface";
import { logOut } from "@/lib/auth";

export function UserInformation({ user }: { user: User }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex flex-row items-center gap-2 rounded-lg pr-1 pl-3"
        >
          <p className="text-sm">Hello, {user.name}</p>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/app/teams">
            Teams
            <DropdownMenuShortcut>
              <LucideUsers className="size-3" />
            </DropdownMenuShortcut>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/app/users/${user.$id}`}>
            Profile
            <DropdownMenuShortcut>
              <LucideUser className="size-3" />
            </DropdownMenuShortcut>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={logOut}>
          Logout
          <DropdownMenuShortcut>
            <LucideLogOut className="size-3" />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
