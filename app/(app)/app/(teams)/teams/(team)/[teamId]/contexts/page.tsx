import { LucideFingerprint } from "lucide-react";

import { getContextByTeam } from "@/lib/context";

export default async function ContextPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const { data: contexts, success } = await getContextByTeam(teamId);

  return (
    <div className="space-y-6 p-4 max-w-6xl mx-auto w-full">
      <header>
        <h1 className="text-2xl font-bold">Context</h1>
        <p className="text-muted-foreground">
          View your contexts and their attributes.
        </p>
      </header>
      {success && contexts && contexts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        </div>
      ) : (
        <div className="text-center">
          <LucideFingerprint className="size-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No contexts yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Contexts are created automatically when you use them in your
            application. Start by integrating the SDK and defining your
            contexts.
          </p>
        </div>
      )}
    </div>
  );
}
