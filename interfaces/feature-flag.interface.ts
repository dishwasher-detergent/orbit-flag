import { Models } from "node-appwrite";

export interface FeatureFlag extends Models.Row {
  name: string;
  key: string;
  description: string;
  status: "active" | "inactive" | "archived";
  teamId: string;
  variationIds: string[];
  variations?: Variation[];
  conditionIds: string[];
  conditions?: Condition[];
}

export interface Variation extends Models.Row {
  name: string;
  value: string;
  isDefault: boolean;
}

export interface Condition extends Models.Row {
  contextAttribute: string;
  operator: string;
  values: string[];
  variationId: string;
}
