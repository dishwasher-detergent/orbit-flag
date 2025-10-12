"use server";

import { revalidateTag } from "next/cache";
import { ID, Permission, Query, Role, TablesDB } from "node-appwrite";

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
import { createAdminClient, createSessionClient } from "@/lib/server/appwrite";
import {
  CreateFeatureFlagFormData,
  DeleteFeatureFlagFormData,
  EditFeatureFlagFormData,
} from "./schemas";

//#region Auth Required Functions

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

    const permissions = [
      Permission.read(Role.team(data.teamId)),
      Permission.write(Role.team(data.teamId)),
    ];

    const result = await createFeatureFlagCore(database, data, permissions);

    if (result.success) {
      revalidateTag(`flags:team-${data.teamId}`);
    }

    return result;
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
    return getFeatureFlagsByTeamCore(database, teamId);
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
    return getFeatureFlagByIdCore(database, id);
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

    const permissions = [
      Permission.read(Role.team(data.teamId)),
      Permission.write(Role.team(data.teamId)),
    ];

    const result = await updateFeatureFlagCore(database, data, permissions);

    if (result.success) {
      revalidateTag(`flags:team-${data.teamId}`);
    }

    return result;
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

    // Get team ID for cache invalidation before deletion
    const flag = await database.getRow({
      databaseId: DATABASE_ID,
      tableId: FLAG_COLLECTION_ID,
      rowId: data.id,
    });

    const result = await deleteFeatureFlagCore(database, data.id);

    if (result.success) {
      revalidateTag(`flags:team-${flag.teamId}`);
    }

    return result;
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

    const result = await updateFeatureFlagStatusCore(database, id, status);

    if (result.success) {
      // Get team ID for cache invalidation
      const flag = await database.getRow<FeatureFlag>({
        databaseId: DATABASE_ID,
        tableId: FLAG_COLLECTION_ID,
        rowId: id,
      });

      revalidateTag(`flags:team-${flag.teamId}`);
    }

    return result;
  });
}

//#region Auth Required Functions

//#region Admin Functions

/**
 * Get feature flags by team (Admin)
 * @param {string} teamId The team ID
 * @returns {Promise<Result<FeatureFlag[]>>} The feature flags
 */
export async function getFeatureFlagsByTeamAdmin(
  teamId: string
): Promise<Result<FeatureFlag[]>> {
  const { table: database } = await createAdminClient();
  return getFeatureFlagsByTeamCore(database, teamId);
}

/**
 * Get feature flag by ID (Admin)
 * @param {string} flagId The flag ID
 * @returns {Promise<Result<FeatureFlag>>} The feature flag
 */
export async function getFeatureFlagByIdAdmin(
  flagId: string
): Promise<Result<FeatureFlag>> {
  const { table: database } = await createAdminClient();
  return getFeatureFlagByIdCore(database, flagId);
}

/**
 * Update feature flag status (Admin)
 * @param {string} flagId The flag ID
 * @param {"active" | "inactive" | "archived"} status The new status
 * @returns {Promise<Result<FeatureFlag>>} The updated feature flag
 */
export async function updateFeatureFlagStatusAdmin(
  flagId: string,
  status: "active" | "inactive" | "archived"
): Promise<Result<FeatureFlag>> {
  const { table: database } = await createAdminClient();
  return updateFeatureFlagStatusCore(database, flagId, status);
}

/**
 * Toggle feature flag status (active <-> inactive) (Admin)
 * @param {string} flagId The flag ID
 * @returns {Promise<Result<FeatureFlag>>} The updated feature flag
 */
export async function toggleFeatureFlagAdmin(
  flagId: string
): Promise<Result<FeatureFlag>> {
  const { table: database } = await createAdminClient();
  return toggleFeatureFlagCore(database, flagId);
}

/**
 * Create feature flag (Admin)
 * @param {CreateFeatureFlagFormData} data The feature flag data
 * @returns {Promise<Result<FeatureFlag>>} The created feature flag
 */
export async function createFeatureFlagAdmin(
  data: CreateFeatureFlagFormData
): Promise<Result<FeatureFlag>> {
  const { table: database } = await createAdminClient();
  // Admin functions don't need specific permissions
  return createFeatureFlagCore(database, data, []);
}

/**
 * Update feature flag (Admin)
 * @param {EditFeatureFlagFormData} data The feature flag data
 * @returns {Promise<Result<FeatureFlag>>} The updated feature flag
 */
export async function updateFeatureFlagAdmin(
  data: EditFeatureFlagFormData
): Promise<Result<FeatureFlag>> {
  const { table: database } = await createAdminClient();
  // Admin functions don't need specific permissions
  return updateFeatureFlagCore(database, data, []);
}

/**
 * Delete feature flag (Admin)
 * @param {string} flagId The flag ID
 * @returns {Promise<Result<void>>} The deletion result
 */
export async function deleteFeatureFlagAdmin(
  flagId: string
): Promise<Result<void>> {
  const { table: database } = await createAdminClient();
  return deleteFeatureFlagCore(database, flagId);
}

//#endregion

//#region Core Functions

/**
 * Core function to get feature flags by team with any database client
 * @param {TablesDB} database The database client (admin or session)
 * @param {string} teamId The team ID
 * @returns {Promise<Result<FeatureFlag[]>>} The feature flags
 */
async function getFeatureFlagsByTeamCore(
  database: TablesDB,
  teamId: string
): Promise<Result<FeatureFlag[]>> {
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
}

/**
 * Core function to get feature flag by ID with any database client
 * @param {TablesDB} database The database client (admin or session)
 * @param {string} flagId The flag ID
 * @returns {Promise<Result<FeatureFlag>>} The feature flag
 */
async function getFeatureFlagByIdCore(
  database: TablesDB,
  flagId: string
): Promise<Result<FeatureFlag>> {
  try {
    const flag = await database.getRow<FeatureFlag>({
      databaseId: DATABASE_ID,
      tableId: FLAG_COLLECTION_ID,
      rowId: flagId,
    });

    // Get variations
    const variations = await database.listRows<Variation>({
      databaseId: DATABASE_ID,
      tableId: VARIATION_COLLECTION_ID,
      queries: [Query.equal("flagId", flag.$id)],
    });

    flag.variations = variations.rows;

    // Get conditions for each variation
    for (const variation of flag.variations) {
      const conditions = await database.listRows<Condition>({
        databaseId: DATABASE_ID,
        tableId: CONDITION_COLLECTION_ID,
        queries: [Query.equal("variationId", variation.$id)],
      });

      (variation as any).conditions = conditions.rows;
    }

    return {
      success: true,
      message: "Feature flag retrieved successfully",
      data: flag,
    };
  } catch (error) {
    console.error("Error getting feature flag:", error);
    return {
      success: false,
      message: "Failed to get feature flag",
    };
  }
}

/**
 * Core function to update feature flag status with any database client
 * @param {TablesDB} database The database client (admin or session)
 * @param {string} flagId The flag ID
 * @param {"active" | "inactive" | "archived"} status The new status
 * @returns {Promise<Result<FeatureFlag>>} The updated feature flag
 */
async function updateFeatureFlagStatusCore(
  database: TablesDB,
  flagId: string,
  status: "active" | "inactive" | "archived"
): Promise<Result<FeatureFlag>> {
  try {
    const updatedFlag = await database.updateRow<FeatureFlag>({
      databaseId: DATABASE_ID,
      tableId: FLAG_COLLECTION_ID,
      rowId: flagId,
      data: {
        status,
      },
    });

    return {
      success: true,
      message: "Feature flag status updated successfully",
      data: updatedFlag,
    };
  } catch (error) {
    console.error("Error updating feature flag status:", error);
    return {
      success: false,
      message: "Failed to update feature flag status",
    };
  }
}

/**
 * Core function to toggle feature flag status (active <-> inactive) with any database client
 * @param {TablesDB} database The database client (admin or session)
 * @param {string} flagId The flag ID
 * @returns {Promise<Result<FeatureFlag>>} The updated feature flag
 */
async function toggleFeatureFlagCore(
  database: TablesDB,
  flagId: string
): Promise<Result<FeatureFlag>> {
  try {
    const flag = await database.getRow<FeatureFlag>({
      databaseId: DATABASE_ID,
      tableId: FLAG_COLLECTION_ID,
      rowId: flagId,
    });

    const newStatus = flag.status === "active" ? "inactive" : "active";
    return updateFeatureFlagStatusCore(database, flagId, newStatus);
  } catch (error) {
    console.error("Error toggling feature flag:", error);
    return {
      success: false,
      message: "Failed to toggle feature flag",
    };
  }
}

/**
 * Core function to create feature flag with any database client
 * @param {TablesDB} database The database client (admin or session)
 * @param {CreateFeatureFlagFormData} data The feature flag data
 * @param {string[]} permissions The permissions (optional for admin)
 * @returns {Promise<Result<FeatureFlag>>} The created feature flag
 */
async function createFeatureFlagCore(
  database: TablesDB,
  data: CreateFeatureFlagFormData,
  permissions: string[] = []
): Promise<Result<FeatureFlag>> {
  try {
    const variationIds: string[] = [];
    const variationIdMap: Map<string, string> = new Map();

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
        permissions,
      });
      variationIds.push(variationId);

      if (variation.id) {
        variationIdMap.set(variation.id, variationId);
      }
    }

    const conditionIds: string[] = [];
    for (const condition of data.conditions || []) {
      const conditionId = ID.unique();

      const actualVariationId =
        variationIdMap.get(condition.variationId) || condition.variationId;

      await database.createRow<Condition>({
        databaseId: DATABASE_ID,
        tableId: CONDITION_COLLECTION_ID,
        rowId: conditionId,
        data: {
          contextAttribute: condition.contextAttribute,
          operator: condition.operator,
          values: condition.values,
          variationId: actualVariationId,
        },
        permissions,
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
      permissions,
    });

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
}

/**
 * Core function to update feature flag with any database client
 * @param {TablesDB} database The database client (admin or session)
 * @param {EditFeatureFlagFormData} data The feature flag data
 * @param {string[]} permissions The permissions (optional for admin)
 * @returns {Promise<Result<FeatureFlag>>} The updated feature flag
 */
async function updateFeatureFlagCore(
  database: TablesDB,
  data: EditFeatureFlagFormData,
  permissions: string[] = []
): Promise<Result<FeatureFlag>> {
  try {
    const existingFlag = await database.getRow<FeatureFlag>({
      databaseId: DATABASE_ID,
      tableId: FLAG_COLLECTION_ID,
      rowId: data.id,
    });

    // Delete existing variations
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

    // Delete existing conditions
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
    const variationIdMap: Map<string, string> = new Map();

    // Create new variations
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
        permissions,
      });
      variationIds.push(variationId);

      if (variation.id) {
        variationIdMap.set(variation.id, variationId);
      }
    }

    // Create new conditions
    const conditionIds: string[] = [];
    for (const condition of data.conditions || []) {
      const conditionId = ID.unique();

      const actualVariationId =
        variationIdMap.get(condition.variationId) || condition.variationId;

      await database.createRow<Condition>({
        databaseId: DATABASE_ID,
        tableId: CONDITION_COLLECTION_ID,
        rowId: conditionId,
        data: {
          contextAttribute: condition.contextAttribute,
          operator: condition.operator,
          values: condition.values,
          variationId: actualVariationId,
        },
        permissions,
      });
      conditionIds.push(conditionId);
    }

    // Update the flag
    const updatedFlag = await database.updateRow<FeatureFlag>({
      databaseId: DATABASE_ID,
      tableId: FLAG_COLLECTION_ID,
      rowId: data.id,
      data: {
        name: data.name,
        key: data.key,
        description: data.description || "",
        status: data.status,
        variationIds,
        conditionIds,
      },
    });

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
}

/**
 * Core function to delete feature flag with any database client
 * @param {TablesDB} database The database client (admin or session)
 * @param {string} flagId The flag ID
 * @returns {Promise<Result<void>>} The deletion result
 */
async function deleteFeatureFlagCore(
  database: TablesDB,
  flagId: string
): Promise<Result<void>> {
  try {
    const flag = await database.getRow({
      databaseId: DATABASE_ID,
      tableId: FLAG_COLLECTION_ID,
      rowId: flagId,
    });

    // Delete variations
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

    // Delete conditions
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

    // Delete the flag
    await database.deleteRow({
      databaseId: DATABASE_ID,
      tableId: FLAG_COLLECTION_ID,
      rowId: flagId,
    });

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
}

//#endregion
