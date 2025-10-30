import { Card } from "@/components/ui/card";

export default function FeaturesSection() {
  return (
    <section>
      <div className="py-24">
        <div className="mx-auto w-full max-w-3xl px-6">
          <h2 className="text-foreground text-balance text-3xl font-semibold md:text-4xl">
            <span className="text-muted-foreground">
              Empowering development teams with
            </span>{" "}
            powerful feature management
          </h2>
          <div className="@container mt-12 space-y-12">
            <Card
              variant="soft"
              className="relative overflow-hidden p-0 sm:col-span-2 w-full aspect-video border"
            >
              <img
                src="/feature-conditions.png"
                alt=""
                className="absolute inset-0 size-full object-cover object-top-left"
              />
            </Card>
            <div className="@sm:grid-cols-2 @2xl:grid-cols-3 grid gap-6">
              <div className="space-y-2">
                <h3 className="font-medium">Control Rollouts</h3>
                <p className="text-muted-foreground text-sm">
                  Deploy features gradually with confidence, enabling or
                  disabling features in real-time.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Target Users</h3>
                <p className="text-muted-foreground text-sm">
                  Define conditions and rules to show features to specific user
                  segments.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Manage Variations</h3>
                <p className="text-muted-foreground text-sm">
                  Create multiple variations of features for A/B testing and
                  experimentation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
