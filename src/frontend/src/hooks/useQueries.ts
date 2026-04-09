// useQueries.ts — stub hooks; app state is managed via AppContext (localStorage)
// These hooks return empty arrays to satisfy callers that may import them.
import { useQuery } from "@tanstack/react-query";

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => [] as unknown[],
    enabled: false,
  });
}

export function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: async () => [] as unknown[],
    enabled: false,
  });
}

export function useStudents() {
  return useQuery({
    queryKey: ["students"],
    queryFn: async () => [] as unknown[],
    enabled: false,
  });
}

export function useAllResults() {
  return useQuery({
    queryKey: ["allResults"],
    queryFn: async () => [] as unknown[],
    enabled: false,
  });
}
