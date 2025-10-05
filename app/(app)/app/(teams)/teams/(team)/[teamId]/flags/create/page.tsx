"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useTransition } from "react";
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
import { createFeatureFlag } from "@/lib/feature-flag";
import {
  CreateFeatureFlagFormData,
  createFeatureFlagSchema,
} from "@/lib/feature-flag/schemas";

export default function CreateFeatureFlagPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;

  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateFeatureFlagFormData>({
    resolver: zodResolver(createFeatureFlagSchema),
    defaultValues: {
      name: "",
      key: "",
      description: "",
      status: FEATURE_FLAG_STATUS.INACTIVE,
      defaultValue: false,
      variations: [],
      teamId: teamId,
    },
  });

  const onSubmit = (data: CreateFeatureFlagFormData) => {
    startTransition(async () => {
      try {
        const formData = {
          ...data,
        };

        const result = await createFeatureFlag(formData);

        if (result.success) {
          router.push(`/app/teams/${teamId}/flags`);
        } else {
          console.error("Failed to create feature flag:", result.message);
        }
      } catch (error) {
        console.error("Error creating feature flag:", error);
      }
    });
  };

  const generateKeyFromName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 50);
  };

  const handleNameChange = (name: string) => {
    if (!form.getFieldState("key").isTouched) {
      form.setValue("key", generateKeyFromName(name));
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Feature Flag</h1>
          <p>Set up a new feature flag with targeting rules</p>
        </div>
      </div>
      <div>
        <h2 className="font-semibold text-base mb-2">Details</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <section className="space-y-4">
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
                          onChange={(e) => {
                            field.onChange(e);
                            handleNameChange(e.target.value);
                          }}
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
                        <Input {...field} placeholder="flag_name" />
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>
            <FeatureFlagVariations control={form.control} />
            <FeatureFlagConditions control={form.control} />
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Create Feature Flag
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
