import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { FEATURE_FLAG_OPERATORS } from "@/constants/feature-flag.constants";
import { getFeatureFlagsByTeam } from "@/lib/feature-flag";
import { getTeamById } from "@/lib/team";

// Request schema for flag evaluation
const evaluateRequestSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
  flagKey: z.string().min(1, "Flag key is required"),
  context: z.record(z.any()).optional().default({}),
});

export type EvaluateRequestData = z.infer<typeof evaluateRequestSchema>;

// Response schema
interface EvaluateResponse {
  success: boolean;
  flagKey: string;
  value: string | null;
  variation: string | null;
  reason: string;
  error?: string;
}

/**
 * Check if the request origin is whitelisted
 */
async function checkWhitelist(
  request: NextRequest,
  teamId: string
): Promise<boolean> {
  try {
    const teamResult = await getTeamById(teamId);
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
  context: Record<string, any>
): Promise<NextResponse<EvaluateResponse>> {
  const isWhitelisted = await checkWhitelist(request, teamId);
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

  const { data: featureFlags, success } = await getFeatureFlagsByTeam(teamId);

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

  // Check if flag is active
  if (flag.status !== "active") {
    // Return default variation if flag is not active
    const defaultVariation = flag.variations?.find((v) => v.isDefault);
    return NextResponse.json({
      success: true,
      flagKey,
      value: defaultVariation?.value || null,
      variation: defaultVariation?.name || null,
      reason: `Flag is ${flag.status}, returned default variation`,
    });
  }

  // Evaluate conditions
  const matchingVariation = evaluateConditions(flag, context);

  return NextResponse.json({
    success: true,
    flagKey,
    value: matchingVariation.value,
    variation: matchingVariation.name,
    reason: matchingVariation.reason,
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
function evaluateConditions(flag: any, context: Record<string, any>) {
  const variations = flag.variations || [];
  const conditions = flag.conditions || [];

  // If no conditions, return default variation
  if (conditions.length === 0) {
    const defaultVariation = variations.find((v: any) => v.isDefault);
    return {
      value: defaultVariation?.value || null,
      name: defaultVariation?.name || null,
      reason: "No conditions defined, returned default variation",
    };
  }

  // Evaluate each condition
  for (const condition of conditions) {
    if (evaluateCondition(condition, context)) {
      const variation = variations.find(
        (v: any) => v.$id === condition.variationId
      );
      return {
        value: variation?.value || null,
        name: variation?.name || null,
        reason: `Condition matched: ${condition.contextAttribute} ${
          condition.operator
        } ${condition.values.join(", ")}`,
      };
    }
  }

  // No conditions matched, return default variation
  const defaultVariation = variations.find((v: any) => v.isDefault);
  return {
    value: defaultVariation?.value || null,
    name: defaultVariation?.name || null,
    reason: "No conditions matched, returned default variation",
  };
}

/**
 * Evaluate a single condition against the context
 */
function evaluateCondition(
  condition: any,
  context: Record<string, any>
): boolean {
  const { contextAttribute, operator, values } = condition;
  const contextValue = context[contextAttribute];

  // If context attribute is not provided, condition fails
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

    default:
      console.warn(`Unknown operator: ${operator}`);
      return false;
  }
}
