import { NextRequest, NextResponse } from "next/server";
import { ID, Permission, Role } from "node-appwrite";
import { z } from "zod";

import {
  FEATURE_FLAG_APPROVAL,
  FEATURE_FLAG_OPERATORS,
  FEATURE_FLAG_STATUS,
} from "@/constants/feature-flag.constants";
import { Evaluation } from "@/interfaces/evaluation.interface";
import { Condition, FeatureFlag } from "@/interfaces/feature-flag.interface";
import { DATABASE_ID, EVALUATION_COLLECTION_ID } from "@/lib/constants";
import { createContextAdmin } from "@/lib/context";
import { getFeatureFlagsByTeamAdmin } from "@/lib/feature-flag";
import { createAdminClient } from "@/lib/server/appwrite";
import { getTeamByIdAdmin } from "@/lib/team";

const evaluateRequestSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
  flagKey: z.string().min(1, "Flag key is required"),
  context: z.record(z.any()).optional().default({}),
});

export type EvaluateRequestData = z.infer<typeof evaluateRequestSchema>;

interface EvaluateResponse {
  success: boolean;
  flagKey: string;
  value: string | null;
  variation: string | null;
  reason: string;
  error?: string;
}

/**
 * Save evaluation result to database
 */
async function saveEvaluation(
  teamId: string,
  flag: FeatureFlag,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: Record<string, any>,
  result: {
    value: string | null;
    variation: string | null;
    reason: string;
  },
  request: NextRequest
): Promise<void> {
  try {
    const { table: database } = await createAdminClient();

    const permissions = [
      Permission.read(Role.team(teamId)),
      Permission.write(Role.team(teamId)),
    ];

    const evaluationData = {
      teamId,
      flagId: flag.$id,
      flagKey: flag.key,
      context: JSON.stringify(context),
      result: JSON.stringify(result),
      variation: result.variation,
      value: result.value,
      reason: result.reason,
      userAgent: request.headers.get("user-agent") || undefined,
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        undefined,
    };

    await database.createRow<Evaluation>({
      databaseId: DATABASE_ID,
      tableId: EVALUATION_COLLECTION_ID,
      rowId: ID.unique(),
      data: evaluationData,
      permissions,
    });
  } catch (error) {
    console.error("Failed to save evaluation:", error);
  }
}

/**
 * Check if the request origin is whitelisted
 */
async function checkWhitelist(
  request: NextRequest,
  teamId: string
): Promise<boolean> {
  try {
    const teamResult = await getTeamByIdAdmin(teamId);
    if (!teamResult.success || !teamResult.data) {
      return false;
    }

    const team = teamResult.data;

    if (!team.whitelist || team.whitelist.length === 0) {
      return true;
    }

    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");

    const requestOrigins = [origin, referer].filter(Boolean);

    for (const requestOrigin of requestOrigins) {
      if (requestOrigin) {
        try {
          const requestUrl = new URL(requestOrigin);
          const requestDomain = `${requestUrl.protocol}//${requestUrl.host}`;

          const isWhitelisted = team.whitelist.some((whitelistUrl) => {
            const whitelistDomain = `${whitelistUrl.protocol}//${whitelistUrl.host}`;
            return whitelistDomain === requestDomain;
          });

          if (isWhitelisted) {
            return true;
          }
        } catch (error) {
          console.error("Error checking request origin:", error);

          continue;
        }
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking whitelist:", error);
    return false;
  }
}

/**
 * Shared flag evaluation logic
 */
async function evaluateFlag(
  request: NextRequest,
  teamId: string,
  flagKey: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: Record<string, any>
): Promise<NextResponse<EvaluateResponse>> {
  const isWhitelisted = true; // await checkWhitelist(request, teamId);
  if (!isWhitelisted) {
    return NextResponse.json(
      {
        success: false,
        flagKey,
        value: null,
        variation: null,
        reason: "Domain not whitelisted",
        error:
          "Your domain is not authorized to access this team's feature flags",
      },
      { status: 403 }
    );
  }

  const { data: featureFlags, success } = await getFeatureFlagsByTeamAdmin(
    teamId
  );

  if (!success || !featureFlags) {
    return NextResponse.json(
      {
        success: false,
        flagKey,
        value: null,
        variation: null,
        reason: "Failed to fetch feature flags",
        error: "Unable to retrieve feature flags for team",
      },
      { status: 500 }
    );
  }

  const flag = featureFlags.find((f) => f.key === flagKey);

  if (!flag) {
    return NextResponse.json(
      {
        success: false,
        flagKey,
        value: null,
        variation: null,
        reason: "Flag not found",
        error: `Feature flag with key '${flagKey}' not found`,
      },
      { status: 404 }
    );
  }

  if (
    flag.status !== FEATURE_FLAG_STATUS.ACTIVE ||
    flag.approval !== FEATURE_FLAG_APPROVAL.APPROVED
  ) {
    const defaultVariation = flag.variations?.find((v) => v.isDefault);

    const result = {
      value: defaultVariation?.value || null,
      variation: defaultVariation?.name || null,
      reason: `Flag is ${flag.status}, returned default variation`,
    };

    // Save evaluation and context (async, don't wait)
    Promise.all([
      createContextAdmin(teamId, flagKey, context),
      saveEvaluation(teamId, flag, context, result, request),
    ]).then(([contextResult]) => {
      if (!contextResult.success) console.error(contextResult);
    });

    return NextResponse.json({
      success: true,
      flagKey,
      ...result,
    });
  }

  const matchingVariation = evaluateConditions(flag, context);

  const result = {
    value: matchingVariation.value,
    variation: matchingVariation.name,
    reason: matchingVariation.reason,
  };

  // Save evaluation and context (async, don't wait)
  Promise.all([
    createContextAdmin(teamId, flagKey, context),
    saveEvaluation(teamId, flag, context, result, request),
  ]).then(([contextResult]) => {
    if (!contextResult.success) console.error(contextResult);
  });

  return NextResponse.json({
    success: true,
    flagKey,
    ...result,
  });
}

/**
 * Evaluate a feature flag based on context (POST)
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<EvaluateResponse>> {
  try {
    const body = await request.json();
    const validatedData = evaluateRequestSchema.parse(body);

    const { teamId, flagKey, context } = validatedData;
    return await evaluateFlag(request, teamId, flagKey, context);
  } catch (error) {
    console.error("Error evaluating feature flag:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          flagKey: "",
          value: null,
          variation: null,
          reason: "Invalid request data",
          error: error.errors
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join(", "),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        flagKey: "",
        value: null,
        variation: null,
        reason: "Internal server error",
        error: "An unexpected error occurred while evaluating the feature flag",
      },
      { status: 500 }
    );
  }
}

/**
 * Evaluate conditions and return the appropriate variation
 */
function evaluateConditions(
  flag: FeatureFlag,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: Record<string, any>
) {
  const variations = flag.variations || [];
  const conditions = flag.conditions || [];

  if (conditions.length === 0) {
    const defaultVariation = variations.find((v) => v.isDefault);
    return {
      value: defaultVariation?.value || null,
      name: defaultVariation?.name || null,
      reason: "No conditions defined, returned default variation",
    };
  }

  console.log(conditions);

  for (const condition of conditions) {
    console.log(context);

    if (evaluateCondition(condition, context, flag.key)) {
      const variation = variations.find((v) => v.$id === condition.variationId);
      const reasonText =
        condition.operator === FEATURE_FLAG_OPERATORS.PERCENTAGE_ROLLOUT
          ? `Percentage rollout matched: ${condition.values[0]}% for ${condition.contextAttribute}`
          : `Condition matched: ${condition.contextAttribute} ${
              condition.operator
            } ${condition.values.join(", ")}`;

      return {
        value: variation?.value || null,
        name: variation?.name || null,
        reason: reasonText,
      };
    }
  }

  const defaultVariation = variations.find((v) => v.isDefault);

  return {
    value: defaultVariation?.value || null,
    name: defaultVariation?.name || null,
    reason: "No conditions matched, returned default variation",
  };
}

/**
 * Generate a consistent hash from a string
 * Uses a simple hash function for consistent percentage calculations
 */
function simpleHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Calculate percentage bucket for consistent rollouts
 */
function calculatePercentageBucket(
  userIdentifier: string,
  flagKey: string,
  contextAttribute: string
): number {
  // Create a consistent seed from user identifier, flag key, and context attribute
  const seed = `${userIdentifier}:${flagKey}:${contextAttribute}`;
  const hash = simpleHash(seed);
  // Return a value between 0 and 99 (inclusive)
  return hash % 100;
}

/**
 * Evaluate a single condition against the context
 */
function evaluateCondition(
  condition: Condition,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: Record<string, any>,
  flagKey?: string
): boolean {
  const { contextAttribute, operator, values } = condition;
  const contextValue = context[contextAttribute];

  if (contextValue === undefined || contextValue === null) {
    return false;
  }

  const contextValueStr = String(contextValue);
  const contextValueNum = Number(contextValue);

  switch (operator) {
    case FEATURE_FLAG_OPERATORS.EQUALS:
      return values.some((value: string) => contextValueStr === value);

    case FEATURE_FLAG_OPERATORS.NOT_EQUALS:
      return !values.some((value: string) => contextValueStr === value);

    case FEATURE_FLAG_OPERATORS.CONTAINS:
      return values.some((value: string) => contextValueStr.includes(value));

    case FEATURE_FLAG_OPERATORS.NOT_CONTAINS:
      return !values.some((value: string) => contextValueStr.includes(value));

    case FEATURE_FLAG_OPERATORS.IN:
      return values.includes(contextValueStr);

    case FEATURE_FLAG_OPERATORS.NOT_IN:
      return !values.includes(contextValueStr);

    case FEATURE_FLAG_OPERATORS.GREATER_THAN:
      return (
        !isNaN(contextValueNum) &&
        values.some((value: string) => {
          const numValue = Number(value);
          return !isNaN(numValue) && contextValueNum > numValue;
        })
      );

    case FEATURE_FLAG_OPERATORS.LESS_THAN:
      return (
        !isNaN(contextValueNum) &&
        values.some((value: string) => {
          const numValue = Number(value);
          return !isNaN(numValue) && contextValueNum < numValue;
        })
      );

    case FEATURE_FLAG_OPERATORS.GREATER_THAN_OR_EQUAL:
      return (
        !isNaN(contextValueNum) &&
        values.some((value: string) => {
          const numValue = Number(value);
          return !isNaN(numValue) && contextValueNum >= numValue;
        })
      );

    case FEATURE_FLAG_OPERATORS.LESS_THAN_OR_EQUAL:
      return (
        !isNaN(contextValueNum) &&
        values.some((value: string) => {
          const numValue = Number(value);
          return !isNaN(numValue) && contextValueNum <= numValue;
        })
      );

    case FEATURE_FLAG_OPERATORS.STARTS_WITH:
      return values.some((value: string) => contextValueStr.startsWith(value));

    case FEATURE_FLAG_OPERATORS.ENDS_WITH:
      return values.some((value: string) => contextValueStr.endsWith(value));

    case FEATURE_FLAG_OPERATORS.PERCENTAGE_ROLLOUT:
      if (!flagKey) {
        console.warn("Flag key is required for percentage rollout evaluation");
        return false;
      }

      if (values.length !== 1) {
        console.warn(
          "Percentage rollout requires exactly one percentage value"
        );
        return false;
      }

      const targetPercentage = parseFloat(values[0]);
      if (
        isNaN(targetPercentage) ||
        targetPercentage < 0 ||
        targetPercentage > 100
      ) {
        console.warn("Invalid percentage value for rollout:", values[0]);
        return false;
      }

      const userBucket = calculatePercentageBucket(
        contextValueStr,
        flagKey,
        contextAttribute
      );

      console.log(userBucket);

      return userBucket < targetPercentage;

    default:
      console.warn(`Unknown operator: ${operator}`);
      return false;
  }
}
