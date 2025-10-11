"use server";

import { revalidateTag } from "next/cache";
import { ID, Permission, Query, Role } from "node-appwrite";

import {
  Condition,
  FeatureFlag,
  Variation,
} from "@/interfaces/feature-flag.interface";
import { Result } from "@/interfaces/result.interface";
import { withAuth } from "@/lib/auth";
import {
  CONDITION_COLLECTION_ID,
  DATABASE_ID,
  FLAG_COLLECTION_ID,
  VARIATION_COLLECTION_ID,
} from "@/lib/constants";
import { createSessionClient } from "@/lib/server/appwrite";
import {
  CreateFeatureFlagFormData,
  DeleteFeatureFlagFormData,
  EditFeatureFlagFormData,
} from "./schemas";

/**
 * Create a new feature flag
 * @param {CreateFeatureFlagFormData} data The feature flag data
 * @returns {Promise<Result<FeatureFlag>>} The created feature flag
 */
export async function createFeatureFlag(
  data: CreateFeatureFlagFormData
): Promise<Result<FeatureFlag>> {
  return withAuth(async (user) => {
    const { table: database } = await createSessionClient();

    try {
      const variationIds: string[] = [];
      for (const variation of data.variations) {
        const variationId = ID.unique();
        await database.createRow<Variation>({
          databaseId: DATABASE_ID,
          tableId: VARIATION_COLLECTION_ID,
          rowId: variationId,
          data: {
            name: variation.name,
            value: variation.value,
            isDefault: variation.isDefault,
          },
          permissions: [
            Permission.read(Role.team(data.teamId)),
            Permission.write(Role.team(data.teamId)),
          ],
        });
        variationIds.push(variationId);
      }

      const conditionIds: string[] = [];
      for (const condition of data.conditions || []) {
        const conditionId = ID.unique();
        await database.createRow<Condition>({
          databaseId: DATABASE_ID,
          tableId: CONDITION_COLLECTION_ID,
          rowId: conditionId,
          data: {
            contextAttribute: condition.contextAttribute,
            operator: condition.operator,
            values: condition.values,
            variationId: condition.variationId,
          },
          permissions: [
            Permission.read(Role.team(data.teamId)),
            Permission.write(Role.team(data.teamId)),
          ],
        });
        conditionIds.push(conditionId);
      }

      const flagId = ID.unique();
      const flag = await database.createRow<FeatureFlag>({
        databaseId: DATABASE_ID,
        tableId: FLAG_COLLECTION_ID,
        rowId: flagId,
        data: {
          name: data.name,
          key: data.key,
          description: data.description || "",
          status: data.status,
          teamId: data.teamId,
          variationIds,
          conditionIds,
        },
        permissions: [
          Permission.read(Role.team(data.teamId)),
          Permission.write(Role.team(data.teamId)),
        ],
      });

      revalidateTag(`flags:team-${data.teamId}`);

      return {
        success: true,
        message: "Feature flag created successfully",
        data: flag,
      };
    } catch (error) {
      console.error("Error creating feature flag:", error);
      return {
        success: false,
        message: "Failed to create feature flag",
      };
    }
  });
}

/**
 * Get all feature flags for a team
 * @param {string} teamId The team ID
 * @returns {Promise<Result<FeatureFlag[]>>} The feature flags
 */
export async function getFeatureFlagsByTeam(
  teamId: string
): Promise<Result<FeatureFlag[]>> {
  return withAuth(async () => {
    const { table: database } = await createSessionClient();

    try {
      const flags = await database.listRows<FeatureFlag>({
        databaseId: DATABASE_ID,
        tableId: FLAG_COLLECTION_ID,
        queries: [Query.equal("teamId", teamId)],
      });

      const enrichedFlags: FeatureFlag[] = await Promise.all(
        flags.rows.map(async (flag: FeatureFlag) => {
          const variations = await Promise.all(
            (flag.variationIds || []).map(async (variationId: string) => {
              try {
                return await database.getRow<Variation>({
                  databaseId: DATABASE_ID,
                  tableId: VARIATION_COLLECTION_ID,
                  rowId: variationId,
                });
              } catch {
                return null;
              }
            })
          );

          const conditions = await Promise.all(
            (flag.conditionIds || []).map(async (conditionId: string) => {
              try {
                return await database.getRow<Condition>({
                  databaseId: DATABASE_ID,
                  tableId: CONDITION_COLLECTION_ID,
                  rowId: conditionId,
                });
              } catch {
                return null;
              }
            })
          );

          return {
            ...flag,
            variations: variations.filter((x) => x !== null),
            conditions: conditions.filter((x) => x !== null),
          };
        })
      );

      return {
        success: true,
        message: "Feature flags retrieved successfully",
        data: enrichedFlags,
      };
    } catch (error) {
      console.error("Error getting feature flags:", error);
      return {
        success: false,
        message: "Failed to get feature flags",
      };
    }
  });
}

/**
 * Get a feature flag by ID
 * @param {string} id The feature flag ID
 * @returns {Promise<Result<FeatureFlag>>} The feature flag
 */
export async function getFeatureFlagById(
  id: string
): Promise<Result<FeatureFlag>> {
  return withAuth(async () => {
    const { table: database } = await createSessionClient();

    try {
      const flag = await database.getRow<FeatureFlag>({
        databaseId: DATABASE_ID,
        tableId: FLAG_COLLECTION_ID,
        rowId: id,
      });

      const variations = await Promise.all(
        (flag.variationIds || []).map(async (variationId: string) => {
          try {
            return await database.getRow<Variation>({
              databaseId: DATABASE_ID,
              tableId: VARIATION_COLLECTION_ID,
              rowId: variationId,
            });
          } catch {
            return null;
          }
        })
      );

      const conditions = await Promise.all(
        (flag.conditionIds || []).map(async (conditionId: string) => {
          try {
            return await database.getRow<Condition>({
              databaseId: DATABASE_ID,
              tableId: CONDITION_COLLECTION_ID,
              rowId: conditionId,
            });
          } catch {
            return null;
          }
        })
      );

      const enrichedFlag: FeatureFlag = {
        ...flag,
        variations: variations.filter((x) => x !== null),
        conditions: conditions.filter((x) => x !== null),
      };

      return {
        success: true,
        message: "Feature flag retrieved successfully",
        data: enrichedFlag,
      };
    } catch (error) {
      console.error("Error getting feature flag:", error);
      return {
        success: false,
        message: "Failed to get feature flag",
      };
    }
  });
}

/**
 * Update a feature flag
 * @param {EditFeatureFlagFormData} data The feature flag data
 * @returns {Promise<Result<FeatureFlag>>} The updated feature flag
 */
export async function updateFeatureFlag(
  data: EditFeatureFlagFormData
): Promise<Result<FeatureFlag>> {
  return withAuth(async (user) => {
    const { table: database } = await createSessionClient();

    try {
      const existingFlag = await database.getRow<FeatureFlag>({
        databaseId: DATABASE_ID,
        tableId: FLAG_COLLECTION_ID,
        rowId: data.id,
      });

      for (const variationId of existingFlag.variationIds || []) {
        try {
          await database.deleteRow({
            databaseId: DATABASE_ID,
            tableId: VARIATION_COLLECTION_ID,
            rowId: variationId,
          });
        } catch {
          console.error("Variation might already be deleted");
        }
      }

      for (const conditionId of existingFlag.conditionIds || []) {
        try {
          await database.deleteRow({
            databaseId: DATABASE_ID,
            tableId: CONDITION_COLLECTION_ID,
            rowId: conditionId,
          });
        } catch {
          console.error("Condition might already be deleted");
        }
      }

      const variationIds: string[] = [];
      for (const variation of data.variations) {
        const variationId = ID.unique();
        await database.createRow<Variation>({
          databaseId: DATABASE_ID,
          tableId: VARIATION_COLLECTION_ID,
          rowId: variationId,
          data: {
            name: variation.name,
            value: variation.value,
            isDefault: variation.isDefault,
          },
          permissions: [
            Permission.read(Role.team(data.teamId)),
            Permission.write(Role.team(data.teamId)),
          ],
        });
        variationIds.push(variationId);
      }

      const conditionIds: string[] = [];
      for (const condition of data.conditions || []) {
        const conditionId = ID.unique();
        await database.createRow<Condition>({
          databaseId: DATABASE_ID,
          tableId: CONDITION_COLLECTION_ID,
          rowId: conditionId,
          data: {
            contextAttribute: condition.contextAttribute,
            operator: condition.operator,
            values: condition.values,
            variationId: condition.variationId,
          },
          permissions: [
            Permission.read(Role.team(data.teamId)),
            Permission.write(Role.team(data.teamId)),
          ],
        });
        conditionIds.push(conditionId);
      }

      const updatedFlag = await database.updateRow<FeatureFlag>({
        databaseId: DATABASE_ID,
        tableId: FLAG_COLLECTION_ID,
        rowId: data.id,
        data: {
          name: data.name,
          key: data.key,
          description: data.description || "",
          status: data.status,
          teamId: data.teamId,
          variationIds,
          conditionIds,
        },
      });

      revalidateTag(`flags:team-${data.teamId}`);

      return {
        success: true,
        message: "Feature flag updated successfully",
        data: updatedFlag,
      };
    } catch (error) {
      console.error("Error updating feature flag:", error);
      return {
        success: false,
        message: "Failed to update feature flag",
      };
    }
  });
}

/**
 * Delete a feature flag
 * @param {DeleteFeatureFlagFormData} data The feature flag data
 * @returns {Promise<Result<void>>} Success status
 */
export async function deleteFeatureFlag(
  data: DeleteFeatureFlagFormData
): Promise<Result<void>> {
  return withAuth(async () => {
    const { table: database } = await createSessionClient();

    try {
      const flag = await database.getRow({
        databaseId: DATABASE_ID,
        tableId: FLAG_COLLECTION_ID,
        rowId: data.id,
      });

      for (const variationId of flag.variationIds || []) {
        try {
          await database.deleteRow({
            databaseId: DATABASE_ID,
            tableId: VARIATION_COLLECTION_ID,
            rowId: variationId,
          });
        } catch {
          console.error("Variation might already be deleted");
        }
      }

      for (const conditionId of flag.conditionIds || []) {
        try {
          await database.deleteRow({
            databaseId: DATABASE_ID,
            tableId: CONDITION_COLLECTION_ID,
            rowId: conditionId,
          });
        } catch {
          console.error("Condition might already be deleted");
        }
      }

      await database.deleteRow({
        databaseId: DATABASE_ID,
        tableId: FLAG_COLLECTION_ID,
        rowId: data.id,
      });

      revalidateTag(`flags:team-${flag.teamId}`);

      return {
        success: true,
        message: "Feature flag deleted successfully",
        data: undefined,
      };
    } catch (error) {
      console.error("Error deleting feature flag:", error);
      return {
        success: false,
        message: "Failed to delete feature flag",
      };
    }
  });
}

/**
 * Toggle feature flag status
 * @param {string} id The feature flag ID
 * @param {string} status The new status (active/inactive/archived)
 * @returns {Promise<Result<FeatureFlag>>} The updated feature flag
 */
export async function toggleFeatureFlag(
  id: string,
  status: "active" | "inactive" | "archived"
): Promise<Result<FeatureFlag>> {
  return withAuth(async (user) => {
    const { table: database } = await createSessionClient();

    try {
      const updatedFlag = await database.updateRow<FeatureFlag>({
        databaseId: DATABASE_ID,
        tableId: FLAG_COLLECTION_ID,
        rowId: id,
        data: {
          status,
        },
      });

      const flag = await database.getRow<FeatureFlag>({
        databaseId: DATABASE_ID,
        tableId: FLAG_COLLECTION_ID,
        rowId: id,
      });

      revalidateTag(`flags:team-${flag.teamId}`);

      return {
        success: true,
        message: "Feature flag status updated successfully",
        data: updatedFlag,
      };
    } catch (error) {
      console.error("Error toggling feature flag:", error);
      return {
        success: false,
        message: "Failed to toggle feature flag",
      };
    }
  });
}
