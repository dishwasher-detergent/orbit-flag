import { ChevronLeft, LucideFingerprint } from "lucide-react";
import Link from "next/link";
import { Query } from "node-appwrite";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SimplePagination } from "@/components/ui/simple-pagination";
import { getContextByTeam } from "@/lib/context";

export default async function ContextPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ offset?: string; limit?: string }>;
}) {
  const { teamId } = await params;
  const { offset = "0", limit = "10" } = await searchParams;

  const currentOffset = Math.max(0, parseInt(offset) || 0);
  const pageLimit = Math.min(50, Math.max(6, parseInt(limit) || 12));

  const queries = [Query.limit(pageLimit + 1), Query.offset(currentOffset)];

  const { data: allContexts, success } = await getContextByTeam(
    teamId,
    queries
  );

  const hasNextPage = allContexts ? allContexts.length > pageLimit : false;
  const contexts = allContexts ? allContexts.slice(0, pageLimit) : [];

  return (
    <>
      <PageHeader
        icon={LucideFingerprint}
        title="Contexts"
        description="View and manage your contexts used for feature flag targeting."
      />
      {success && contexts && contexts.length > 0 ? (
        <div>
          <section className="grid grid-cols-1 gap-2">
            {contexts.map((context) => (
              <div
                key={context.$id}
                className="border p-1 rounded-lg bg-sidebar"
              >
                <pre className="bg-background border rounded-lg p-2 mb-2">
                  {JSON.stringify(JSON.parse(context.context), null, 2)}
                </pre>
                <time className="text-xs text-muted-foreground pb-1 px-1 block">
                  {new Date(context.$createdAt).toLocaleString()}
                </time>
              </div>
            ))}
          </section>
          <div className="mt-2">
            <SimplePagination
              offset={currentOffset}
              limit={pageLimit}
              hasNextPage={hasNextPage}
              currentCount={contexts.length}
            />
          </div>
        </div>
      ) : (
        <section className="p-4 border border-input bg-sidebar rounded-lg flex flex-col items-center">
          <LucideFingerprint className="size-12 text-muted-foreground/50 mb-2" />
          <h3 className="text-lg font-semibold mb-2 text-center">
            {currentOffset > 0 ? "No more contexts" : "No contexts yet"}
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto text-center mb-4 text-sm">
            {currentOffset > 0
              ? "You've reached the end of the list. Try going back to see previous contexts."
              : "Contexts are created automatically when you use them in your application. Start by integrating the SDK and defining your contexts."}
          </p>
          {currentOffset > 0 && (
            <Button asChild variant="outline">
              <Link href={`/app/teams/${teamId}/contexts`}>
                <ChevronLeft className="size-4 mr-1" />
                Back to First Page
              </Link>
            </Button>
          )}
        </section>
      )}
    </>
  );
}
