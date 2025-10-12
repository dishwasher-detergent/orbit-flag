"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { FEATURE_FLAG_STATUS } from "@/constants/feature-flag.constants";
import { createFeatureFlag } from "@/lib/feature-flag";
import {
  CreateFeatureFlagFormData,
  createFeatureFlagSchema,
} from "@/lib/feature-flag/schemas";

interface CreateFeatureFlagFormProps {
  teamId: string;
}

export function CreateFeatureFlagForm({ teamId }: CreateFeatureFlagFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateFeatureFlagFormData>({
    resolver: zodResolver(createFeatureFlagSchema),
    defaultValues: {
      name: "",
      key: "",
      description: "",
      status: FEATURE_FLAG_STATUS.INACTIVE,
      variations: [
        {
          id: `default_variation_true`,
          name: "True",
          value: "true",
          isDefault: true,
        },
        {
          id: `default_variation_false`,
          name: "False",
          value: "false",
          isDefault: false,
        },
      ],
      conditions: [
        {
          contextAttribute: "",
          operator: undefined,
          values: [],
          variationId: "",
        },
      ],
      teamId: teamId,
    },
  });

  const watchedVariations = useWatch({
    control: form.control,
    name: "variations",
  });

  const onSubmit = (data: CreateFeatureFlagFormData) => {
    startTransition(async () => {
      const formData = {
        ...data,
      };

      const result = await createFeatureFlag(formData);

      if (result.success) {
        toast.success(result.message);
        router.push(`/app/teams/${teamId}/flags/${result.data?.$id}`);
      } else {
        toast.error(result.message);
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
        {watchedVariations && watchedVariations.length > 0 ? (
          <FeatureFlagConditions control={form.control} />
        ) : (
          <section>
            <h2 className="font-semibold text-base">Conditions</h2>
            <p className="text-sm">
              Conditions can only be applied when variations are present.
            </p>
          </section>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            asChild
          >
            <Link href={`/app/teams/${teamId}/flags`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isPending} size="sm">
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
  );
}
