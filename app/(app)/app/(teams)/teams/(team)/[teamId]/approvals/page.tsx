import { LucideThumbsUp } from "lucide-react";
import Link from "next/link";
import { Query } from "node-appwrite";

import { ApprovalActions } from "@/components/feature-flag/approval-actions";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ADMIN_ROLE } from "@/constants/team.constants";
import { FeatureFlag } from "@/interfaces/feature-flag.interface";
import { getFeatureFlagsByTeam } from "@/lib/feature-flag";
import { getCurrentUserRoles } from "@/lib/team";
import { redirect } from "next/navigation";

export default async function ApprovalsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  const { data: roles } = await getCurrentUserRoles(teamId);

  if (!roles?.includes(ADMIN_ROLE)) {
    redirect(`/app/teams/${teamId}`);
  }

  const { data: pendingFlags, success } = await getFeatureFlagsByTeam(teamId, [
    Query.equal("approval", "pending"),
  ]);

  return (
    <>
      <PageHeader
        icon={LucideThumbsUp}
        title="Pending Approvals"
        description="Review and approve feature flag changes that require authorization"
      />
      {success && pendingFlags && pendingFlags.length > 0 ? (
        <section className="border rounded-lg overflow-hidden p-1 bg-sidebar">
          <div className="border border-input rounded-lg bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-full">Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingFlags.map((flag: FeatureFlag) => (
                  <TableRow
                    key={flag.$id}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="align-top">
                      <Button
                        asChild
                        variant="link"
                        className="p-0 has-[>svg]:px-0 h-auto text-foreground"
                      >
                        <Link href={`/app/teams/${teamId}/flags/${flag.$id}`}>
                          {flag.name}
                        </Link>
                      </Button>
                      {flag.description && (
                        <div className="text-sm text-muted-foreground truncate max-w-md mt-1">
                          {flag.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                        {flag.key}
                      </code>
                    </TableCell>
                    <TableCell className="align-top">
                      <span className="text-sm text-muted-foreground">
                        {new Date(flag.$createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="align-top">
                      <ApprovalActions flag={flag} teamId={teamId} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      ) : (
        <section className="border bg-sidebar rounded-lg p-1">
          <div className="p-4 border border-input bg-background rounded-lg flex flex-col items-center">
            <LucideThumbsUp className="size-12 text-muted-foreground/50 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-center mb-2">
              No pending approvals
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto text-center mb-4">
              All feature flag changes have been processed. New requests
              requiring approval will appear here.
            </p>
            <Button asChild variant="outline">
              <Link href={`/app/teams/${teamId}/flags`}>View All Flags</Link>
            </Button>
          </div>
        </section>
      )}
    </>
  );
}
