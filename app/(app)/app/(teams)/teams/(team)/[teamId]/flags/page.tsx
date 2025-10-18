import { LucideLink, LucideToggleLeft, Plus, ToggleLeft } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
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
import { FeatureFlag } from "@/interfaces/feature-flag.interface";
import { getFeatureFlagsByTeam } from "@/lib/feature-flag";

export default async function FlagsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const { data: featureFlags, success } = await getFeatureFlagsByTeam(teamId);

  return (
    <>
      <PageHeader
        icon={LucideToggleLeft}
        title="Feature Flags"
        description="Manage feature flags and targeting rules for your application"
      >
        {success && featureFlags && featureFlags.length > 0 && (
          <Button asChild>
            <Link href={`/app/teams/${teamId}/flags/create`}>
              <Plus className="size-4" />
              Create Flag
            </Link>
          </Button>
        )}
      </PageHeader>
      {success && featureFlags && featureFlags.length > 0 ? (
        <section className="border rounded-lg overflow-hidden p-1 bg-sidebar">
          <div className="border border-input rounded-lg bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-full">Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Variations</TableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featureFlags.map((flag: FeatureFlag) => (
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
                          <LucideLink className="size-3" />
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
                      <Badge variant={flag.status}>{flag.status}</Badge>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">
                          {flag.variations?.length || 0}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          variation{flag.variations?.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">
                          {flag.conditions?.length || 0}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          condition{flag.conditions?.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="text-sm text-muted-foreground">
                        {flag.$createdAt
                          ? new Date(flag.$createdAt).toLocaleDateString()
                          : "N/A"}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      ) : (
        <section className="border bg-sidebar rounded-lg p-1">
          <div className="p-4 border bg-background rounded-lg flex flex-col items-center">
            <ToggleLeft className="size-12 text-muted-foreground/50 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-center mb-2">
              No feature flags yet
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto text-center mb-4">
              Get started by creating your first feature flag. Control feature
              rollouts and target specific users with conditions.
            </p>
            <Button asChild>
              <Link href={`/app/teams/${teamId}/flags/create`}>
                <Plus className="size-4" />
                Create Your First Flag
              </Link>
            </Button>
          </div>
        </section>
      )}
    </>
  );
}
