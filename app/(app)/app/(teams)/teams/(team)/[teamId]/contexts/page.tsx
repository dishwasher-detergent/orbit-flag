import { LucideFingerprint } from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { getContextByTeam } from "@/lib/context";

export default async function ContextPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const { data: contexts, success } = await getContextByTeam(teamId);

  return (
    <>
      <PageHeader
        icon={LucideFingerprint}
        title="Contexts"
        description="View and manage your contexts used for feature flag targeting."
      />
      {success && contexts && contexts.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contexts.map((context) => (
            <div key={context.$id} className="border p-1 rounded-lg bg-sidebar">
              <pre className="bg-background border rounded-lg p-2 mb-2">
                {JSON.stringify(JSON.parse(context.context), null, 2)}
              </pre>
              <time className="text-sm text-muted-foreground pb-1 px-1 block">
                {new Date(context.$createdAt).toLocaleString()}
              </time>
            </div>
          ))}
        </section>
      ) : (
        <section className="border bg-sidebar rounded-lg p-1">
          <div className="p-4 border bg-background rounded-lg flex flex-col items-center">
            <LucideFingerprint className="size-12 text-muted-foreground/50 mb-2" />
            <h3 className="text-lg font-semibold mb-2 text-center">
              No contexts yet
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto text-center">
              Contexts are created automatically when you use them in your
              application. Start by integrating the SDK and defining your
              contexts.
            </p>
          </div>
        </section>
      )}
    </>
  );
}
