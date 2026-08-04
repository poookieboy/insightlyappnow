import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useCloudSync } from "@/hooks/useCloudSync";
import { commit, getState } from "@/lib/store";
import { applyGradeProgression } from "@/lib/grade-progression";

/**
 * Invisible controller mounted for every signed-in learner.
 * - Keeps the account in sync across all of their devices.
 * - Advances the learner's grade when a new academic year starts.
 */
export function AccountSync() {
  useCloudSync();
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    const profile = getState().profile;
    if (!profile) return;
    checked.current = true;

    const result = applyGradeProgression(profile);
    if (!result) return;
    commit((s) => (s.profile ? { ...s, profile: result.profile } : s));
    if (result.advancedBy > 0) {
      toast.success(`New academic year — you've moved up to ${result.newGrade} 🎓`, {
        description: "You can change this any time in Settings.",
        duration: 8000,
      });
    }
  });

  return null;
}
