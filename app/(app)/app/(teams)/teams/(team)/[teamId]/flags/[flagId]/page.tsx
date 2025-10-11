"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";

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
import { FEATURE_FLAG_STATUS } from "@/constants/feature-flag.constants";
import { getFeatureFlagById, updateFeatureFlag } from "@/lib/feature-flag";
import {
  EditFeatureFlagFormData,
  editFeatureFlagSchema,
} from "@/lib/feature-flag/schemas";

export default function EditFeatureFlagPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;
  const flagId = params.flagId as string;

  const [isPending, startTransition] = useTransition();

  const form = useForm<EditFeatureFlagFormData>({
    resolver: zodResolver(editFeatureFlagSchema),
    defaultValues: {
      id: flagId,
      name: "",
      key: "",
      description: "",
      status: FEATURE_FLAG_STATUS.INACTIVE,
      variations: [],
      conditions: [],
      teamId: teamId,
    },
  });

  useEffect(() => {
    const loadFlag = async () => {
      const { data: flag, success } = await getFeatureFlagById(flagId);

      if (success && flag) {
        form.reset({
          id: flag.$id,
          name: flag.name,
          key: flag.key,
          description: flag.description || "",
          status: flag.status as any,
          variations: (flag.variations || []).map((v: any) => ({
            id: v.$id,
            name: v.name,
            value: v.value as "true" | "false",
            isDefault: v.isDefault,
          })),
          conditions: (flag.conditions || []).map((c: any) => ({
            id: c.$id,
            contextAttribute: c.contextAttribute,
            operator: c.operator,
            values: c.values,
            variationId: c.variationId,
          })),
          teamId: flag.teamId,
        });
      }
    };
    loadFlag();
  }, [flagId, form]);

  const onSubmit = (data: EditFeatureFlagFormData) => {
    startTransition(async () => {
      try {
        const result = await updateFeatureFlag(data);

        if (result.success) {
          router.push(`/app/teams/${teamId}/flags/${flagId}`);
        } else {
          console.error("Failed to update feature flag:", result.message);
        }
      } catch (error) {
        console.error("Error updating feature flag:", error);
      }
    });
  };

  const watchedVariations = form.watch("variations");

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Create Feature Flag</h1>
        <p>Set up a new feature flag with targeting rules</p>
      </header>
      <div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <section>
              <h2 className="font-semibold text-base mb-2">Details</h2>
              <div className="flex flex-col gap-4 border rounded-lg bg-sidebar p-2">
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
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  router.push(`/app/teams/${teamId}/flags/${flagId}`)
                }
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
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
      </div>
    </div>
  );
}
