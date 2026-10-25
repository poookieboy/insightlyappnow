import { useAuth } from "./useAuth";

/** Notes shares the selected external project's persistent app session. */
export function useNotesAuth() {
  return useAuth();
}