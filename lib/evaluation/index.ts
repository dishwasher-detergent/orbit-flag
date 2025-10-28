"use server";

import { Query } from "node-appwrite";

import { Evaluation } from "@/interfaces/evaluation.interface";
import { Result } from "@/interfaces/result.interface";
import { withAuth } from "@/lib/auth";
import { DATABASE_ID, EVALUATION_COLLECTION_ID } from "@/lib/constants";
import { createSessionClient } from "@/lib/server/appwrite";

/**
 * Get evaluations for a specific flag
 * @param {string} flagId The flag ID
 * @param {number} limit Number of evaluations to fetch
 * @param {string} offset Pagination offset (cursor-based)
 * @returns {Promise<Result<Evaluation[]>>} The evaluations
 */
export async function getEvaluationsByFlag(
  flagId: string,
  limit: number = 50,
  offset?: string
): Promise<Result<Evaluation[]>> {
  return withAuth(async () => {
    const { table: database } = await createSessionClient();

    try {
      const queries = [
        Query.equal("flagId", flagId),
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
      ];

      if (offset) {
        queries.push(Query.cursorAfter(offset));
      }

      const response = await database.listRows<Evaluation>({
        databaseId: DATABASE_ID,
        tableId: EVALUATION_COLLECTION_ID,
        queries,
      });

      return {
        success: true,
        data: response.rows,
        message: "Evaluations retrieved successfully",
      };
    } catch (error) {
      console.error("Error fetching evaluations:", error);
      return {
        success: false,
        message: "Failed to fetch evaluations",
      };
    }
  });
}

/**
 * Get evaluation statistics for a flag
 * @param {string} flagId The flag ID
 * @returns {Promise<Result<EvaluationStats>>} The evaluation statistics
 */
export interface EvaluationStats {
  totalEvaluations: number;
  uniqueUsers: number;
  variationBreakdown: { [variation: string]: number };
  recentEvaluations: number;
}

export async function getEvaluationStats(
  flagId: string
): Promise<Result<EvaluationStats>> {
  return withAuth(async () => {
    const { table: database } = await createSessionClient();

    try {
      const response = await database.listRows<Evaluation>({
        databaseId: DATABASE_ID,
        tableId: EVALUATION_COLLECTION_ID,
        queries: [Query.equal("flagId", flagId), Query.limit(1000)],
      });

      const evaluations = response.rows;
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const totalEvaluations = evaluations.length;
      const uniqueUsers = new Set(
        evaluations
          .map((e) => {
            try {
              const context = JSON.parse(e.context);
              return context.userId || context.user || context.id;
            } catch {
              return null;
            }
          })
          .filter(Boolean)
      ).size;

      const variationBreakdown: { [variation: string]: number } = {};
      let recentEvaluations = 0;

      evaluations.forEach((evaluation) => {
        const variation = evaluation.variation || "default";
        variationBreakdown[variation] =
          (variationBreakdown[variation] || 0) + 1;

        // Count recent evaluations
        const evaluationDate = new Date(evaluation.$createdAt);
        if (evaluationDate >= twentyFourHoursAgo) {
          recentEvaluations++;
        }
      });

      const stats: EvaluationStats = {
        totalEvaluations,
        uniqueUsers,
        variationBreakdown,
        recentEvaluations,
      };

      return {
        success: true,
        data: stats,
        message: "Statistics retrieved successfully",
      };
    } catch (error) {
      console.error("Error calculating evaluation stats:", error);
      return {
        success: false,
        message: "Failed to calculate evaluation statistics",
      };
    }
  });
}
