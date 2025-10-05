"use client";

import { LucidePlus, Trash2 } from "lucide-react";
import { Control, useFieldArray, useWatch } from "react-hook-form";

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
import { FEATURE_FLAG_VALUES } from "@/constants/feature-flag.constants";
import { Variations } from "@/lib/feature-flag/schemas";
import { useMemo } from "react";
import { Checkbox } from "../ui/checkbox";

interface FeatureFlagVariantsProps {
  control: Control<any>;
  name?: string;
}

export function FeatureFlagVariations({
  control,
  name = "variations",
}: FeatureFlagVariantsProps) {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name,
  });

  const addVariant = () => {
    const currentValues = (watchedVariations || [])
      .map((variation: Variations) => variation?.value)
      .filter(Boolean);
    const availableValues = Object.values(FEATURE_FLAG_VALUES).filter(
      (value) => !currentValues.includes(value)
    );
    const value = availableValues[0] || Object.values(FEATURE_FLAG_VALUES)[0];
    const isDefault = fields.length === 0;

    const newCondition: Variations = {
      id: `condition_${Date.now()}`,
      name: "",
      value: value,
      isDefault: isDefault,
    };
    append(newCondition);
  };

  const handleDefaultChange = (index: number, checked: boolean) => {
    if (checked) {
      fields.forEach((field, i) => {
        if (i !== index) {
          update(i, { ...field, isDefault: false });
        }
      });
      update(index, { ...fields[index], isDefault: true });
    } else {
      update(index, { ...fields[index], isDefault: false });
    }
  };

  const watchedVariations = useWatch({
    control,
    name,
    defaultValue: [],
  });

  const getAvailableValues = (currentIndex: number) => {
    const selectedValues = (watchedVariations || [])
      .map((variation: Variations, index: number) =>
        index !== currentIndex ? variation?.value : null
      )
      .filter(Boolean);

    return Object.values(FEATURE_FLAG_VALUES).filter(
      (value) => !selectedValues.includes(value)
    );
  };

  const isDuplicateName = (currentIndex: number, name: string) => {
    if (!name.trim()) return false;

    return (watchedVariations || []).some(
      (variation: Variations, index: number) =>
        index !== currentIndex &&
        variation?.name?.toLowerCase().trim() === name.toLowerCase().trim()
    );
  };

  const errorMessage = useMemo(() => {
    return control.getFieldState("variations").error?.message;
  }, [control]);

  return fields.length === 0 ? (
    <section>
      <h2
        className={`font-semibold text-base ${
          errorMessage ? "text-destructive mb-0" : "mb-2"
        }`}
      >
        Variations
      </h2>
      {errorMessage && (
        <p className="mb-2 text-sm text-destructive">{errorMessage}</p>
      )}
      <Button type="button" size="sm" onClick={addVariant}>
        <LucidePlus className="size-4" />
        Add Variant
      </Button>
    </section>
  ) : (
    <section>
      <h2
        className={`font-semibold text-base ${
          errorMessage ? "text-destructive mb-0" : "mb-2"
        }`}
      >
        Variations
      </h2>
      {errorMessage && (
        <p className="mb-2 text-sm text-destructive">{errorMessage}</p>
      )}
      <ul className="flex flex-col border rounded-lg bg-sidebar">
        {fields.map((field, index) => (
          <li
            key={field.id}
            className="w-full flex items-start gap-2 p-2 pt-3 not-last:border-b border-dashed"
          >
            <FormField
              control={control}
              name={`${name}.${index}.name`}
              render={({ field }) => {
                const hasDuplicate = isDuplicateName(index, field.value);
                return (
                  <FormItem className="flex-1">
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        className={`bg-background ${
                          hasDuplicate
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }`}
                        placeholder="Variation Name"
                        {...field}
                      />
                    </FormControl>
                    {hasDuplicate && (
                      <p className="text-sm text-destructive">
                        Name must be unique
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={control}
              name={`${name}.${index}.value`}
              render={({ field }) => {
                const availableValues = getAvailableValues(index);
                // Include current field value even if it's already selected
                const selectOptions =
                  field.value && !availableValues.includes(field.value)
                    ? [...availableValues, field.value]
                    : availableValues;

                return (
                  <FormItem className="flex-1">
                    <FormLabel>Value</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full bg-background">
                          <SelectValue placeholder="Select a value" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectOptions.map((val) => (
                          <SelectItem key={val} value={val}>
                            {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={control}
              name={`${name}.${index}.isDefault`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Default</FormLabel>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        handleDefaultChange(index, checked === true)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              onClick={() => remove(index)}
              size="icon"
              variant="ghost"
              className="flex-none *:hover:bg-red-600/10 text-red-600 hover:text-red-800"
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex justify-center mt-2 mb-3 relative">
        {fields.length < Object.values(FEATURE_FLAG_VALUES).length && (
          <>
            <div className="w-0.5 h-2 left-1/2 -translate-x-1/2 bg-border absolute -top-2" />
            <Button
              type="button"
              size="icon"
              className="size-7"
              onClick={addVariant}
            >
              <LucidePlus className="size-4" />
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
