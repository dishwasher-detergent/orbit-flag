import { Query } from "node-appwrite";

import { Context } from "@/interfaces/context.interface";
import { Result } from "@/interfaces/result.interface";
import { withAuth } from "@/lib/auth";
import { CONTEXT_COLLECTION_ID, DATABASE_ID } from "@/lib/constants";
import { createSessionClient } from "@/lib/server/appwrite";

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
        queries: [Query.equal("teamId", teamId)],
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
