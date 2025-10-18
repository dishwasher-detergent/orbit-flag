"use server";

import { revalidateTag, unstable_cache } from "next/cache";
import { ID, Permission, Query, Role, TablesDB } from "node-appwrite";

import { FEATURE_FLAG_APPROVAL } from "@/constants/feature-flag.constants";
import { ADMIN_ROLE } from "@/constants/team.constants";
import { Approval } from "@/interfaces/approval.interface";
import {
  Condition,
  FeatureFlag,
  FeatureFlagApproval,
  FeatureFlagStatus,
  Variation,
} from "@/interfaces/feature-flag.interface";
import { Result } from "@/interfaces/result.interface";
import { withAuth } from "@/lib/auth";
import {
  APPROVAL_COLLECTION_ID,
  CONDITION_COLLECTION_ID,
  DATABASE_ID,
  FLAG_COLLECTION_ID,
  VARIATION_COLLECTION_ID,
} from "@/lib/constants";
import { createAdminClient, createSessionClient } from "@/lib/server/appwrite";
import { getCurrentUserRoles } from "../team";
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

    try {
      const transaction = await database.createTransaction({
        ttl: 60,
      });

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
          transactionId: transaction.$id,
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
          transactionId: transaction.$id,
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
          approval: FEATURE_FLAG_APPROVAL.PENDING,
          teamId: data.teamId,
          variationIds,
          conditionIds,
        },
        permissions,
        transactionId: transaction.$id,
      });

      await database.updateTransaction({
        transactionId: transaction.$id,
        commit: true,
      });

      revalidateTag(`feature-flags:${data.teamId}`);

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
  teamId: string,
  queries: string[] = []
): Promise<Result<FeatureFlag[]>> {
  return withAuth(async () => {
    const { table: database } = await createSessionClient();

    return unstable_cache(
      async (teamId, queries) => {
        return getFeatureFlagsByTeamCore(database, teamId, queries);
      },
      ["feature-flags", `feature-flags:${teamId}`, teamId],
      {
        tags: ["feature-flags", `feature-flags:${teamId}`],
        revalidate: 600,
      }
    )(teamId, queries);
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

    return unstable_cache(
      async (id) => {
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
      },
      ["feature-flag", `feature-flag:${id}`, id],
      {
        tags: ["feature-flag", `feature-flag:${id}`],
        revalidate: 600,
      }
    )(id);
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

    try {
      const transaction = await database.createTransaction({
        ttl: 60,
      });

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
            transactionId: transaction.$id,
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
            transactionId: transaction.$id,
          });
        } catch {
          console.error("Condition might already be deleted");
        }
      }

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
          transactionId: transaction.$id,
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
          transactionId: transaction.$id,
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
          variationIds,
          conditionIds,
        },
        transactionId: transaction.$id,
      });

      await database.updateTransaction({
        transactionId: transaction.$id,
        commit: true,
      });

      revalidateTag(`feature-flags:${data.teamId}`);
      revalidateTag(`feature-flag:${data.id}`);

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
      const transaction = await database.createTransaction({
        ttl: 60,
      });

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
            transactionId: transaction.$id,
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
            transactionId: transaction.$id,
          });
        } catch {
          console.error("Condition might already be deleted");
        }
      }

      await database.deleteRow({
        databaseId: DATABASE_ID,
        tableId: FLAG_COLLECTION_ID,
        rowId: data.id,
        transactionId: transaction.$id,
      });

      await database.updateTransaction({
        transactionId: transaction.$id,
        commit: true,
      });

      revalidateTag(`feature-flags:${flag.teamId}`);
      revalidateTag(`feature-flag:${data.id}`);

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
  teamId: string,
  status: FeatureFlagStatus
): Promise<Result<FeatureFlag>> {
  return withAuth(async (user) => {
    const { table: database } = await createSessionClient();
    const { data: roles } = await getCurrentUserRoles(teamId);

    const isAdmin = roles!.includes(ADMIN_ROLE);

    let data = {
      status: status,
      approval: FEATURE_FLAG_APPROVAL.PENDING,
    };

    if (isAdmin) {
      data.approval = FEATURE_FLAG_APPROVAL.APPROVED;
    }

    try {
      const updatedFlag = await database.updateRow<FeatureFlag>({
        databaseId: DATABASE_ID,
        tableId: FLAG_COLLECTION_ID,
        rowId: id,
        data: data,
      });

      revalidateTag(`feature-flags:${teamId}`);
      revalidateTag(`feature-flag:${id}`);

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
  });
}

export async function toggleFeatureFlagApproval(
  id: string,
  teamId: string,
  approval: FeatureFlagApproval
): Promise<Result<FeatureFlag>> {
  return withAuth(async (user) => {
    const { table: database } = await createSessionClient();
    const { data: roles } = await getCurrentUserRoles(teamId);

    const isAdmin = roles!.includes(ADMIN_ROLE);

    if (!isAdmin) {
      return {
        success: false,
        message: "Only admins can toggle feature flag approval.",
      };
    }

    try {
      const transaction = await database.createTransaction({
        ttl: 60,
      });

      const updatedFlag = await database.updateRow<FeatureFlag>({
        databaseId: DATABASE_ID,
        tableId: FLAG_COLLECTION_ID,
        rowId: id,
        data: {
          approval: approval,
        },
        transactionId: transaction.$id,
      });

      await database.updateRow<Approval>({
        databaseId: DATABASE_ID,
        tableId: APPROVAL_COLLECTION_ID,
        rowId: ID.unique(),
        data: {
          approvalUserId: user.$id,
          flagId: id,
          teamId: teamId,
          approval: approval,
        },
        transactionId: transaction.$id,
      });

      await database.updateTransaction({
        transactionId: transaction.$id,
        commit: true,
      });

      revalidateTag(`feature-flags:${teamId}`);
      revalidateTag(`feature-flag:${id}`);

      return {
        success: true,
        message: "Feature flag approval status updated successfully",
        data: updatedFlag,
      };
    } catch (error) {
      console.error("Error updating feature flag approval status:", error);

      return {
        success: false,
        message: "Failed to update feature flag approval status",
      };
    }
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
  teamId: string,
  queries: string[] = []
): Promise<Result<FeatureFlag[]>> {
  try {
    const flags = await database.listRows<FeatureFlag>({
      databaseId: DATABASE_ID,
      tableId: FLAG_COLLECTION_ID,
      queries: [Query.equal("teamId", teamId), ...queries],
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

//#endregion
