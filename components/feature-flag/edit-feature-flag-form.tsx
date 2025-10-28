"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pause, Play, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FeatureFlagConditions } from "@/components/feature-flag/conditions";
import { FeatureFlagVariations } from "@/components/feature-flag/variations";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FEATURE_FLAG_OPERATORS,
  FEATURE_FLAG_STATUS,
} from "@/constants/feature-flag.constants";
import { FeatureFlag } from "@/interfaces/feature-flag.interface";
import { toggleFeatureFlag, updateFeatureFlag } from "@/lib/feature-flag";
import {
  EditFeatureFlagFormData,
  editFeatureFlagSchema,
} from "@/lib/feature-flag/schemas";
import { DeleteFeatureFlag } from "./delete";

interface EditFeatureFlagFormProps {
  flag: FeatureFlag;
  teamId: string;
}

export function EditFeatureFlagForm({
  flag,
  teamId,
}: EditFeatureFlagFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isToggling, setIsToggling] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(flag.status);

  const form = useForm<EditFeatureFlagFormData>({
    resolver: zodResolver(editFeatureFlagSchema),
    defaultValues: {
      id: flag.$id,
      name: flag.name,
      key: flag.key,
      description: flag.description || "",
      status: flag.status as FEATURE_FLAG_STATUS,
      variations: (flag.variations || []).map((v) => ({
        id: v.$id,
        name: v.name,
        value: v.value as "true" | "false",
        isDefault: v.isDefault,
      })),
      conditions: (flag.conditions || []).map((c) => ({
        id: c.$id,
        contextAttribute: c.contextAttribute,
        operator: c.operator as FEATURE_FLAG_OPERATORS,
        values: c.values,
        variationId: c.variationId,
      })),
      teamId: flag.teamId,
    },
  });

  const onSubmit = (data: EditFeatureFlagFormData) => {
    startTransition(async () => {
      const result = await updateFeatureFlag(data);

      if (result.success) {
        toast.success(result.message);
        router.push(`/app/teams/${teamId}/flags/${flag.$id}`);
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleToggleStatus = async () => {
    setIsToggling(true);

    const newStatus = currentStatus === "active" ? "inactive" : "active";

    try {
      const result = await toggleFeatureFlag(flag.$id, teamId, newStatus);

      if (result.success) {
        setCurrentStatus(newStatus);
        form.setValue("status", newStatus as FEATURE_FLAG_STATUS);
        toast.success(
          `Feature flag ${
            newStatus === "active" ? "activated" : "deactivated"
          } successfully`
        );
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to update feature flag status");
    } finally {
      setIsToggling(false);
    }
  };

  const watchedVariations = form.watch("variations");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <section>
          <h2 className="font-semibold text-base mb-2">Details</h2>
          <div className="flex flex-col gap-4 border rounded-lg bg-sidebar p-1 pt-2">
            <div className="flex flex-row gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Flag Name"
                        className="bg-background"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="key"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Key</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="flag_name"
                        className="bg-background"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe what this feature flag controls..."
                      rows={3}
                      className="bg-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>
        <FeatureFlagVariations control={form.control} />
        {watchedVariations && watchedVariations.length > 0 && (
          <FeatureFlagConditions control={form.control} />
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" disabled={isPending} asChild>
            <Link href={`/app/teams/${teamId}/flags`}>Cancel</Link>
          </Button>
          <Button
            type="button"
            variant={currentStatus === "active" ? "ghostDestructive" : "ghost"}
            disabled={isPending || isToggling}
            onClick={handleToggleStatus}
          >
            {isToggling ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {currentStatus === "active"
                  ? "Deactivating..."
                  : "Activating..."}
              </>
            ) : (
              <>
                {currentStatus === "active" ? (
                  <>
                    <Pause className="size-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Play className="size-4" />
                    Activate
                  </>
                )}
              </>
            )}
          </Button>
          <DeleteFeatureFlag flag={flag} teamId={teamId} />
          <Button type="submit" disabled={isPending || isToggling}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="size-4" />
                Update Feature Flag
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
