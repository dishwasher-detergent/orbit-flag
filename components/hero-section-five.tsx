import Link from "next/link";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="py-20">
      <div className="relative z-10 mx-auto w-full max-w-2xl px-6 lg:px-0">
        <div className="relative text-center">
          <Logo className="mx-auto" />
          <h1 className="mx-auto mt-16 max-w-xl text-balance text-5xl font-medium">
            Feature Flags Made Simple
          </h1>
          <p className="text-muted-foreground mx-auto mb-6 mt-4 text-balance text-xl">
            Control feature rollouts, manage variations, and target specific
            users with Orbit Flag - a powerful feature flag management platform
            built for modern teams.
          </p>
          <div className="flex flex-col items-center gap-2 *:w-full sm:flex-row sm:justify-center sm:*:w-auto">
            <Button asChild variant="default" size="lg">
              <Link href="/app">
                <span className="text-nowrap">Get Started</span>
              </Link>
            </Button>
          </div>
        </div>
        <div className="relative mt-12 overflow-hidden rounded-3xl bg-muted md:mt-16 w-full aspect-video border">
          <img
            src="/flags-list.png"
            alt=""
            className="absolute inset-0 size-full object-cover object-top-left"
          />
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <p className="text-muted-foreground text-center">
            Trusted by teams at :
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="flex font-bold font-rubik">KURIOH.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
