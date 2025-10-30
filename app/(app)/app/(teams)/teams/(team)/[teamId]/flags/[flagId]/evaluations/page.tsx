import { Activity, BarChart3, TrendingUp, Users } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getEvaluationsByFlag, getEvaluationStats } from "@/lib/evaluation";
import { getFeatureFlagById } from "@/lib/feature-flag";

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString();
}

function formatContext(contextStr: string) {
  try {
    const context = JSON.parse(contextStr);
    return context.userId || context.user || context.id || "Anonymous";
  } catch {
    return "Invalid context";
  }
}

function formatResult(resultStr: string) {
  try {
    const result = JSON.parse(resultStr);
    return result.value || "N/A";
  } catch {
    return "Invalid result";
  }
}

function getReasonBadgeVariant(reason: string) {
  switch (reason.toLowerCase()) {
    case "match":
      return "default";
    case "no_match":
      return "secondary";
    case "disabled":
      return "destructive";
    case "fallback":
      return "outline";
    default:
      return "secondary";
  }
}

export default async function EvaluationsPage({
  params,
}: {
  params: Promise<{ teamId: string; flagId: string }>;
}) {
  const { teamId, flagId } = await params;

  // Get the feature flag to verify it exists and belongs to the team
  const flagResult = await getFeatureFlagById(flagId);

  if (!flagResult.success || !flagResult.data) {
    notFound();
  }

  const flag = flagResult.data;

  if (flag.teamId !== teamId) {
    redirect(`/app/teams/${flag.teamId}/flags/${flagId}/evaluations`);
  }

  const [evaluationsResult, statsResult] = await Promise.all([
    getEvaluationsByFlag(flagId, 25),
    getEvaluationStats(flagId),
  ]);

  const evaluations = evaluationsResult.success ? evaluationsResult.data : [];
  const stats = statsResult.success ? statsResult.data : null;

  return (
    <>
      <PageHeader
        title={`Evaluations for ${flag.name}`}
        description="View evaluation history and statistics for this feature flag."
        icon={BarChart3}
      />

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Evaluations
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvaluations}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Unique Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Recent (24h)
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.recentEvaluations}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Top Variation
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.entries(stats.variationBreakdown).length > 0
                  ? Object.entries(stats.variationBreakdown).reduce((a, b) =>
                      stats.variationBreakdown[a[0]] >
                      stats.variationBreakdown[b[0]]
                        ? a
                        : b
                    )[0]
                  : "None"}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Variation Breakdown */}
      {stats && Object.keys(stats.variationBreakdown).length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Variation Breakdown</CardTitle>
            <CardDescription>
              Distribution of evaluations across different variations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Object.entries(stats.variationBreakdown).map(
                ([variation, count]) => (
                  <div
                    key={variation}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{variation}</div>
                      <div className="text-sm text-muted-foreground">
                        {stats.totalEvaluations > 0
                          ? ((count / stats.totalEvaluations) * 100).toFixed(1)
                          : 0}
                        %
                      </div>
                    </div>
                    <div className="text-2xl font-bold">{count}</div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Evaluations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Evaluations</CardTitle>
          <CardDescription>
            Latest evaluation results for this feature flag
          </CardDescription>
        </CardHeader>
        <CardContent>
          {evaluations && evaluations.length > 0 ? (
            <div className="border rounded-lg overflow-hidden p-1 bg-sidebar">
              <div className="border rounded-lg bg-background">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Variation</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evaluations.map((evaluation) => (
                      <TableRow key={evaluation.$id}>
                        <TableCell className="font-medium">
                          {formatTimestamp(evaluation.$createdAt)}
                        </TableCell>
                        <TableCell>
                          {formatContext(evaluation.context)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {evaluation.variation || "default"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code className="px-2 py-1 bg-muted rounded text-sm">
                            {evaluation.value ||
                              formatResult(evaluation.result)}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getReasonBadgeVariant(evaluation.reason)}
                          >
                            {evaluation.reason}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {evaluation.ipAddress || "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Evaluations Yet</h3>
              <p className="text-muted-foreground">
                This feature flag hasn&apos;t been evaluated yet. Once your
                application starts using this flag, evaluation data will appear
                here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
