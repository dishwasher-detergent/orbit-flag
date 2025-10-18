import { Models } from "node-appwrite";
import { FeatureFlagApproval } from "./feature-flag.interface";

export interface Approval extends Models.Row {
  approverUserId: string;
  flagId: string;
  teamId: string;
  approval: FeatureFlagApproval;
}
