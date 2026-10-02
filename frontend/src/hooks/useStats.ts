import { useQuery } from "@tanstack/react-query";
import { getStats, getAssessments } from "../lib/api";

export function useStats() {
  return useQuery({ queryKey: ["stats"], queryFn: getStats });
}

export function useAssessments(params: Record<string, string | undefined> = {}) {
  return useQuery({
    queryKey: ["assessments", params],
    queryFn: () => getAssessments(params),
    placeholderData: (prev) => prev // keep the map steady while filters change
  });
}