import { Models } from "node-appwrite";

export interface Evaluation extends Models.Row {
  teamId: string;
  flagId: string;
  flagKey: string;
  context: string; // JSON stringified context object
  result: string; // JSON stringified evaluation result
  variation: string | null;
  value: string | null;
  reason: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface EvaluationResult {
  success: boolean;
  value: string | null;
  variation: string | null;
  reason: string;
  timestamp: string;
}
