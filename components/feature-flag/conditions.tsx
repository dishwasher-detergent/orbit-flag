"use client";

import { LucidePlus, Trash2 } from "lucide-react";
import { Control, useFieldArray } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FEATURE_FLAG_OPERATORS } from "@/constants/feature-flag.constants";
import { Conditions, Variations } from "@/lib/feature-flag/schemas";
import { useMemo } from "react";
import { useWatch } from "react-hook-form";

interface FeatureFlagConditionsProps {
  control: Control<any>;
  name?: string;
}

export function FeatureFlagConditions({
  control,
  name = "conditions",
}: FeatureFlagConditionsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  const variations = useWatch({
    control,
    name: "variations",
  }) as Variations[];

  const addCondition = () => {
    const newCondition: Conditions = {
      id: `condition_${Date.now()}`,
      contextAttribute: "",
      operator: FEATURE_FLAG_OPERATORS.EQUALS,
      values: "",
      variationId: "",
    };
    append(newCondition);
  };

  const errorMessage = useMemo(() => {
    return control.getFieldState("conditions").error?.message;
  }, [control]);

  return fields.length === 0 ? (
    <section>
      <h2
        className={`font-semibold text-base ${
          errorMessage ? "text-destructive mb-0" : "mb-2"
        }`}
      >
        Conditions
      </h2>
      {errorMessage && (
        <p className="mb-2 text-sm text-destructive">{errorMessage}</p>
      )}
      <Button type="button" size="sm" onClick={addCondition}>
        <LucidePlus className="size-4" />
        Add Condition
      </Button>
    </section>
  ) : (
    <section>
      <h2
        className={`font-semibold text-base ${
          errorMessage ? "text-destructive mb-0" : "mb-2"
        }`}
      >
        Conditions
      </h2>
      {errorMessage && (
        <p className="mb-2 text-sm text-destructive">{errorMessage}</p>
      )}
      <ul className="flex flex-col border rounded-lg bg-sidebar">
        {fields.map((field, index) => (
          <li
            key={field.id}
            className="w-full p-2 not-last:border-b border-dashed"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-semibold">
                {index + 1}
              </div>
              <span className="text-sm text-muted-foreground">
                {index === 0
                  ? "First condition (highest priority)"
                  : index === fields.length - 1
                  ? "Last condition (before default)"
                  : `Priority ${index + 1}`}
              </span>
              <div className="ml-auto">
                <Button
                  type="button"
                  onClick={() => remove(index)}
                  size="icon"
                  variant="ghostDestructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-row items-start gap-2">
              <FormField
                control={control}
                name={`${name}.${index}.contextAttribute`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Context Attribute</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-background"
                        placeholder="e.g., userId, email, plan"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`${name}.${index}.operator`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Operator</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background w-full">
                          <SelectValue placeholder="Select operator" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(FEATURE_FLAG_OPERATORS).map(
                          ([key, value]) => (
                            <SelectItem key={value} value={value}>
                              {key.toLowerCase().replace(/_/g, " ")}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`${name}.${index}.values`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Values</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-background"
                        placeholder="e.g., admin,premium or user123"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`${name}.${index}.variationId`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Variation</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background w-full">
                          <SelectValue placeholder="Select variation" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {variations && variations.length > 0 ? (
                          variations.map((variation) => (
                            <SelectItem
                              key={variation.id}
                              value={variation.id || ""}
                            >
                              {variation.name} ({variation.value})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            No variations available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </li>
        ))}
      </ul>
      <div className="flex justify-center my-2 relative">
        <div className="w-0.5 h-2 left-1/2 -translate-x-1/2 bg-border absolute -top-2" />
        <Button
          type="button"
          size="icon"
          className="size-7"
          onClick={addCondition}
        >
          <LucidePlus className="size-4" />
        </Button>
        <div className="w-0.5 h-2 left-1/2 -translate-x-1/2 bg-border absolute -bottom-2" />
      </div>
      <div className="p-3 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Default Variation (fallback)
            </div>
            <div className="text-sm">
              {variations?.find((v) => v.isDefault) ? (
                <span className="inline-flex items-center gap-2 px-2 py-1 bg-background rounded border">
                  <span className="font-medium">
                    {variations.find((v) => v.isDefault)?.name}
                  </span>
                  <span className="text-muted-foreground">
                    ({variations.find((v) => v.isDefault)?.value})
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground italic">
                  No default variation set
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          This variation will be served when no conditions match
        </div>
      </div>
    </section>
  );
}
