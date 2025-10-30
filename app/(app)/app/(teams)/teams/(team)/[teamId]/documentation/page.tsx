import { BookOpen, Code, Wrench } from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function DocumentationUsagePage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  return (
    <>
      <PageHeader
        icon={BookOpen}
        title="Documentation"
        description="Learn how to integrate and use feature flags in your applications"
      />

      <Tabs defaultValue="sdk" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sdk" className="flex items-center gap-2">
            <Code className="size-4" />
            SDK Usage
          </TabsTrigger>
          <TabsTrigger value="rest" className="flex items-center gap-2">
            <Wrench className="size-4" />
            REST API
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sdk" className="space-y-6">
          <section>
            <h2 className="font-semibold text-base">Installation</h2>
            <p className="text-sm text-muted-foreground mb-2">
              Install the Orbit Flag client SDK for JavaScript/TypeScript
              applications
            </p>
            <div className="flex flex-col gap-4 border rounded-lg bg-sidebar p-1">
              <div className="bg-background rounded-md p-4 font-mono text-sm border">
                <code>npm install @orbit-flag/client</code>
              </div>
            </div>
          </section>
          <section>
            <h2 className="font-semibold text-base">Basic Setup</h2>
            <p className="text-sm text-muted-foreground mb-2">
              Initialize the client with your team ID and optional context
            </p>
            <div className="flex flex-col gap-4 border rounded-lg bg-sidebar p-1">
              <div className="bg-background rounded-md p-4 font-mono text-sm border">
                <code>
                  <pre>
                    {`import { OrbitFlagClient } from "@orbit-flag/client";

const client = new OrbitFlagClient({
teamId: "${teamId}",
context: {
  userId: "user-123",
  environment: "production",
  version: "1.2.0",
  // Add any custom context attributes
},
});`}
                  </pre>
                </code>
              </div>
            </div>
          </section>
          <section>
            <h2 className="font-semibold text-base">
              Evaluating Feature Flags
            </h2>
            <p className="text-sm text-muted-foreground mb-2">
              Use the evaluate method to check if a feature flag is enabled
            </p>
            <div className="flex flex-col gap-4 border rounded-lg bg-sidebar p-1">
              <div className="bg-background rounded-md p-4 font-mono text-sm border">
                <code>
                  <pre>
                    {`// Evaluate a boolean feature flag with fallback
const isNewFeatureEnabled = await client.evaluate("new-feature", false);

// Fallback defaults to false if not specified
const isBetaEnabled = await client.evaluate("beta-features");

// Use in conditional logic
if (await client.evaluate("maintenance-mode", false)) {
  console.log("Application is in maintenance mode");
}

// Check if flag exists before evaluation
const exists = await client.flagExists("some-flag");
if (exists) {
  const value = await client.evaluate("some-flag", false);
}`}
                  </pre>
                </code>
              </div>
            </div>
          </section>
        </TabsContent>
        <TabsContent value="rest" className="space-y-6">
          <section>
            <h2 className="font-semibold text-base">
              Evaluating Feature Flags
            </h2>
            <p className="text-sm text-muted-foreground mb-2">
              POST endpoint to evaluate a feature flag for your team
            </p>
            <div className="border rounded-lg bg-sidebar p-1 pt-2 mb-2">
              <div className="text-sm font-medium mb-2 mx-1">Endpoint</div>
              <div className="bg-background border rounded-md p-4 font-mono text-sm">
                <code>POST /api/evaluate</code>
              </div>
            </div>
            <div className="border rounded-lg bg-sidebar p-1 pt-2 mb-2">
              <div className="text-sm font-medium mb-2 mx-1">Request Body</div>
              <div className="bg-background border rounded-md p-4 font-mono text-sm overflow-x-auto">
                <code>
                  <pre>
                    {`{
  "teamId": "${teamId}",
  "flagKey": "your-flag-key",
  "context": {
    "userId": "user-123",
    "environment": "production",
    "version": "1.2.0"
  }
}`}
                  </pre>
                </code>
              </div>
            </div>
            <div className="border rounded-lg bg-sidebar p-1 pt-2">
              <div className="text-sm font-medium mb-2 mx-1">Response</div>
              <div className="bg-background border rounded-md p-4 font-mono text-sm overflow-x-auto">
                <code>
                  <pre>
                    {`{
  "success": true,
  "flagKey": "your-flag-key",
  "value": "true",
  "variation": "enabled",
  "reason": "Condition matched: userId equals user-123"
}`}
                  </pre>
                </code>
              </div>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </>
  );
}
