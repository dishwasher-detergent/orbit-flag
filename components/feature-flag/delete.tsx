"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LucideLoader2, LucideTrash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DyanmicDrawer } from "@/components/ui/dynamic-drawer";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FeatureFlag } from "@/interfaces/feature-flag.interface";
import { deleteFeatureFlag } from "@/lib/feature-flag";
import {
  DeleteFeatureFlagFormData,
  deleteFeatureFlagSchema,
} from "@/lib/feature-flag/schemas";
import { cn } from "@/lib/utils";

export function DeleteFeatureFlag({
  flag,
  teamId,
}: {
  flag: FeatureFlag;
  teamId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <DyanmicDrawer
      title={`Delete ${flag.name}?`}
      description="This action cannot be undone. This will permanently delete the feature flag and all its configurations."
      open={open}
      setOpen={setOpen}
      button={
        <Button
          onClick={() => {
            setOpen(!open);
          }}
          size="sm"
          variant="destructive"
        >
          Delete Flag
          <LucideTrash2 className="size-3.5" />
        </Button>
      }
    >
      <DeleteForm setOpen={setOpen} flag={flag} teamId={teamId} />
    </DyanmicDrawer>
  );
}

interface FormProps extends React.ComponentProps<"form"> {
  setOpen: (e: boolean) => void;
  flag: FeatureFlag;
  teamId: string;
}

function DeleteForm({ className, setOpen, flag, teamId }: FormProps) {
  const router = useRouter();

  const form = useForm<DeleteFeatureFlagFormData>({
    resolver: zodResolver(deleteFeatureFlagSchema),
    defaultValues: {
      id: flag.$id,
      name: "",
    },
  });

  const onSubmit = async (data: DeleteFeatureFlagFormData) => {
    try {
      const result = await deleteFeatureFlag(data);

      if (result.success) {
        toast.success("Feature flag deleted successfully");
        setOpen(false);
        router.push(`/app/teams/${teamId}/flags`);
      } else {
        toast.error(result.message || "Failed to delete feature flag");
      }
    } catch (error) {
      console.error("Error deleting feature flag:", error);
      toast.error("An unexpected error occurred");
    }
  };

  return (
    <Form {...form}>
      <form
        className={cn("grid items-start gap-4", className)}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="grid gap-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Flag Name</FormLabel>
                <FormControl>
                  <Input placeholder={flag.name} {...field} />
                </FormControl>
                <FormDescription>
                  Type <strong>{flag.name}</strong> to confirm deletion.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button
          className="sticky bottom-0"
          type="submit"
          variant="destructive"
          disabled={
            form.formState.isSubmitting ||
            !form.formState.isValid ||
            !form.formState.isDirty
          }
        >
          Delete Feature Flag
          {form.formState.isSubmitting ? (
            <LucideLoader2 className="size-3.5 animate-spin" />
          ) : (
            <LucideTrash2 className="size-3.5" />
          )}
        </Button>
      </form>
    </Form>
  );
}
