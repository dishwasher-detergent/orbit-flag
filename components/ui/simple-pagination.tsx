"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "./button";

interface SimplePaginationProps {
  offset: number;
  limit: number;
  hasNextPage: boolean;
  teamId: string;
  currentCount?: number;
}

export function SimplePagination({
  offset,
  limit,
  hasNextPage,
  teamId,
  currentCount,
}: SimplePaginationProps) {
  const pathname = usePathname();
  const hasPrevPage = offset > 0;

  const createPageUrl = (newOffset: number) => {
    const params = new URLSearchParams();
    params.set("offset", newOffset.toString());
    params.set("limit", limit.toString());
    return `${pathname}?${params.toString()}`;
  };

  if (!hasPrevPage && !hasNextPage) {
    return null;
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {hasPrevPage && (
          <Button asChild variant="outline" size="icon">
            <Link href={createPageUrl(Math.max(0, offset - limit))}>
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
        )}
        {hasNextPage && (
          <Button asChild variant="outline" size="icon">
            <Link href={createPageUrl(offset + limit)}>
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        )}
      </div>
      <div className="text-sm text-muted-foreground">
        Showing {offset + 1} - {offset + (currentCount || limit)} flags
      </div>
    </div>
  );
}
