import { BookOpen, Code, Wrench } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
          <Card>
            <CardHeader>
              <CardTitle>Installation</CardTitle>
              <CardDescription>
                Install the Orbit Flag client SDK for JavaScript/TypeScript
                applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-md p-4 font-mono text-sm">
                <code>npm install @orbit-flag/client</code>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Basic Setup</CardTitle>
              <CardDescription>
                Initialize the client with your team ID and optional context
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-md p-4 font-mono text-sm overflow-x-auto">
                <pre>{`import { OrbitFlagClient } from "@orbit-flag/client";

const client = new OrbitFlagClient({
  teamId: "${teamId}",
  context: {
    userId: "user-123",
    environment: "production",
    version: "1.2.0",
    // Add any custom context attributes
  },
});`}</pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evaluating Feature Flags</CardTitle>
              <CardDescription>
                Use the evaluate method to check if a feature flag is enabled
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-md p-4 font-mono text-sm overflow-x-auto">
                <pre>{`// Evaluate a boolean feature flag with fallback
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
}`}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="rest" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Evaluate Feature Flag</CardTitle>
              <CardDescription>
                POST endpoint to evaluate a feature flag for your team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Endpoint</div>
                <div className="bg-muted rounded-md p-4 font-mono text-sm">
                  <code>POST /api/evaluate</code>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Request Body</div>
                <div className="bg-muted rounded-md p-4 font-mono text-sm overflow-x-auto">
                  <pre>{`{
  "teamId": "${teamId}",
  "flagKey": "your-flag-key",
  "context": {
    "userId": "user-123",
    "environment": "production",
    "version": "1.2.0"
  }
}`}</pre>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Response</div>
                <div className="bg-muted rounded-md p-4 font-mono text-sm overflow-x-auto">
                  <pre>{`{
  "success": true,
  "flagKey": "your-flag-key",
  "value": "true",
  "variation": "enabled",
  "reason": "Condition matched: userId equals user-123"
}`}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
