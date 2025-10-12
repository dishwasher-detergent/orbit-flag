"use client";

import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TeamData } from "@/interfaces/team.interface";
import { updateTeamWhitelist } from "@/lib/team";

interface WhitelistFormProps {
  team: TeamData;
}

export function WhitelistForm({ team }: WhitelistFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [domains, setDomains] = useState<string[]>(
    team.whitelist && team.whitelist.length > 0
      ? team.whitelist.map((url) => url.toString())
      : [""]
  );

  const onSubmit = () => {
    startTransition(async () => {
      // Filter out empty domains and validate URLs
      const filteredDomains = domains.filter((domain) => domain.trim() !== "");

      // Basic URL validation
      const invalidDomains = filteredDomains.filter((domain) => {
        try {
          new URL(domain);
          return false;
        } catch {
          return true;
        }
      });

      if (invalidDomains.length > 0) {
        toast.error(`Invalid URLs: ${invalidDomains.join(", ")}`);
        return;
      }

      const result = await updateTeamWhitelist(team.$id, {
        domains: filteredDomains,
      });

      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  const addDomain = () => {
    setDomains([...domains, ""]);
  };

  const removeDomain = (index: number) => {
    setDomains(domains.filter((_, i) => i !== index));
  };

  const updateDomain = (index: number, value: string) => {
    const newDomains = [...domains];
    newDomains[index] = value;
    setDomains(newDomains);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-2 pl-1">
        <div>
          <h2 className="font-semibold text-base">Domains</h2>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={addDomain}
          disabled={isPending}
        >
          <Plus className="size-4" />
          Add Domain
        </Button>
      </div>
      <div className="bg-sidebar rounded-lg border mb-2">
        <ul>
          {domains.map((domain, index) => (
            <li
              key={index}
              className="flex items-center gap-2 not-last:border-b border-dashed p-1"
            >
              <Input
                value={domain}
                onChange={(e) => updateDomain(index, e.target.value)}
                placeholder="https://example.com"
                disabled={isPending}
                className="flex-1 bg-background"
              />
              {domains.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeDomain(index)}
                  disabled={isPending}
                  className="size-8"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
        {domains.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">
              No domains configured. Add a domain to get started.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={addDomain}
              disabled={isPending}
            >
              <Plus className="size-4" />
              Add First Domain
            </Button>
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground px-2 mb-4">
        Enter the full URLs of domains that should be allowed to access your
        feature flags. For example: https://example.com,
        https://app.example.com, http://localhost:3000
      </p>
      <div className="flex justify-end">
        <Button onClick={onSubmit} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="size-4" />
              Save Whitelist
            </>
          )}
        </Button>
      </div>
    </section>
  );
}
