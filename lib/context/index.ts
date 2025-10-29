import { ID, Permission, Query, Role, TablesDB } from "node-appwrite";

import { Context } from "@/interfaces/context.interface";
import { Result } from "@/interfaces/result.interface";
import { withAuth } from "@/lib/auth";
import { CONTEXT_COLLECTION_ID, DATABASE_ID } from "@/lib/constants";
import { createAdminClient, createSessionClient } from "@/lib/server/appwrite";

//#region Auth Required Functions

/**
 * Get all contexts for a team
 * @param {string} teamId The team ID
 * @returns {Promise<Result<Context[]>>} The contexts
 */
export async function getContextByTeam(
  teamId: string
): Promise<Result<Context[]>> {
  return withAuth(async () => {
    const { table: database } = await createSessionClient();

    try {
      const contexts = await database.listRows<Context>({
        databaseId: DATABASE_ID,
        tableId: CONTEXT_COLLECTION_ID,
        queries: [Query.equal("teamId", teamId), Query.orderDesc("$createdAt")],
      });

      return {
        success: true,
        message: "Contexts retrieved successfully",
        data: contexts.rows,
      };
    } catch (error) {
      console.error("Error getting contexts:", error);
      return {
        success: false,
        message: "Failed to get contexts.",
      };
    }
  });
}

export async function createContext(
  teamId: string,
  flagKey: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
): Promise<Result<Context>> {
  return withAuth(async () => {
    const { table: database } = await createSessionClient();

    const permissions = [
      Permission.read(Role.team(teamId)),
      Permission.write(Role.team(teamId)),
    ];

    return createContextCore(database, teamId, flagKey, data, permissions);
  });
}

//#endregion

//#region Admin Function

/**
 * Create context (Admin)
 * @param {string} teamId The team ID
 * @param {string} flagKey The flag key
 * @param {any} data The context data
 * @returns {Promise<Result<Context>>} The created context
 */
export async function createContextAdmin(
  teamId: string,
  flagKey: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
): Promise<Result<Context>> {
  const { table: database } = await createAdminClient();

  const permissions = [
    Permission.read(Role.team(teamId)),
    Permission.write(Role.team(teamId)),
  ];

  return createContextCore(database, teamId, flagKey, data, permissions);
}

//#endregion

//#region Core Functions

/**
 * Core function to create context with any database client
 * @param {TablesDB} database The database client (admin or session)
 * @param {string} teamId The team ID
 * @param {string} flagKey The flag key
 * @param {any} data The context data
 * @param {string[]} permissions The permissions (optional for admin)
 * @returns {Promise<Result<Context>>} The created context
 */
async function createContextCore(
  database: TablesDB,
  teamId: string,
  flagKey: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  permissions: string[] = []
): Promise<Result<Context>> {
  try {
    const context = await database.createRow<Context>({
      databaseId: DATABASE_ID,
      tableId: CONTEXT_COLLECTION_ID,
      rowId: ID.unique(),
      data: {
        teamId,
        flagKey,
        context: JSON.stringify(data),
      },
      permissions,
    });

    return {
      success: true,
      message: "Context created successfully",
      data: context,
    };
  } catch (error) {
    console.error("Error creating context:", error);
    return {
      success: false,
      message: "Failed to create context.",
    };
  }
}

//#endregion
