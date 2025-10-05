import {
  FEATURE_FLAG_DESCRIPTION_MAX_LENGTH,
  FEATURE_FLAG_KEY_MAX_LENGTH,
  FEATURE_FLAG_NAME_MAX_LENGTH,
  FEATURE_FLAG_OPERATORS,
  FEATURE_FLAG_STATUS,
} from "@/constants/feature-flag.constants";
import { z } from "zod";

export const variationsSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  value: z.string().refine((val) => val === "true" || val === "false"),
  isDefault: z.boolean(),
});

export type Variations = z.infer<typeof variationsSchema>;

export const conditionsSchema = z.object({
  id: z.string().optional(),
  contextAttribute: z.string().min(1, "Context attribute is required"),
  operator: z.nativeEnum(FEATURE_FLAG_OPERATORS),
  values: z.string().min(1, "Values are required"),
  variationId: z.string().min(1, "Variation is required"),
});

export type Conditions = z.infer<typeof conditionsSchema>;

export const createFeatureFlagSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(
      FEATURE_FLAG_NAME_MAX_LENGTH,
      `Name must be less than ${FEATURE_FLAG_NAME_MAX_LENGTH} characters`
    ),
  key: z
    .string()
    .min(2, "Key must be at least 2 characters")
    .max(
      FEATURE_FLAG_KEY_MAX_LENGTH,
      `Key must be less than ${FEATURE_FLAG_KEY_MAX_LENGTH} characters`
    )
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Key can only contain letters, numbers, underscores, and hyphens"
    ),
  description: z
    .string()
    .max(
      FEATURE_FLAG_DESCRIPTION_MAX_LENGTH,
      `Description must be less than ${FEATURE_FLAG_DESCRIPTION_MAX_LENGTH} characters`
    )
    .optional(),
  status: z
    .enum([
      FEATURE_FLAG_STATUS.ACTIVE,
      FEATURE_FLAG_STATUS.INACTIVE,
      FEATURE_FLAG_STATUS.ARCHIVED,
    ] as const)
    .default(FEATURE_FLAG_STATUS.INACTIVE),
  defaultValue: z.boolean().default(false),
  variations: z
    .array(variationsSchema)
    .min(2)
    .default([])
    .refine(
      (variations) => {
        const names = variations
          .map((v) => v.name.toLowerCase().trim())
          .filter(Boolean);
        return new Set(names).size === names.length;
      },
      {
        message: "Variation names must be unique",
      }
    ),
  conditions: z.array(conditionsSchema).default([]),
  teamId: z.string().min(1, "Team ID is required"),
});

export type CreateFeatureFlagFormData = z.infer<typeof createFeatureFlagSchema>;

// Schema for editing feature flags
export const editFeatureFlagSchema = createFeatureFlagSchema.extend({
  id: z.string().min(1, "Feature flag ID is required"),
});

export type EditFeatureFlagFormData = z.infer<typeof editFeatureFlagSchema>;

// Schema for deleting feature flags
export const deleteFeatureFlagSchema = z.object({
  id: z.string().min(1, "Feature flag ID is required"),
  name: z.string().min(1, "Feature flag name is required"),
});

export type DeleteFeatureFlagFormData = z.infer<typeof deleteFeatureFlagSchema>;
