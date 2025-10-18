"use client";

import { Check, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FEATURE_FLAG_APPROVAL } from "@/constants/feature-flag.constants";
import { FeatureFlag } from "@/interfaces/feature-flag.interface";
import { toggleFeatureFlagApproval } from "@/lib/feature-flag";

interface ApprovalActionsProps {
  flag: FeatureFlag;
  teamId: string;
}

export function ApprovalActions({ flag, teamId }: ApprovalActionsProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const result = await toggleFeatureFlagApproval(
        flag.$id,
        teamId,
        FEATURE_FLAG_APPROVAL.APPROVED
      );

      if (result.success) {
        toast.success("Feature flag approved.");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to approve feature flag");
      }
    } catch (error) {
      toast.error("Failed to approve feature flag");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      const result = await toggleFeatureFlagApproval(
        flag.$id,
        teamId,
        FEATURE_FLAG_APPROVAL.REJECTED
      );

      if (result.success) {
        toast.success("Feature flag rejected.");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to reject feature flag");
      }
    } catch (error) {
      toast.error("Failed to reject feature flag");
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="icon"
        variant="default"
        onClick={handleApprove}
        disabled={isApproving || isRejecting}
        className="bg-green-600 hover:bg-green-700"
      >
        {isApproving ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Check className="size-4" />
        )}
      </Button>
      <Button
        size="icon"
        variant="destructive"
        onClick={handleReject}
        disabled={isApproving || isRejecting}
      >
        {isRejecting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <X className="size-4" />
        )}
      </Button>
    </div>
  );
}
