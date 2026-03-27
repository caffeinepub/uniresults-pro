import { useQuery } from "@tanstack/react-query";
import type { backendInterface } from "../backend.d";
import { useActor } from "./useActor";

type FullActor = backendInterface;

export function useDepartments() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as unknown as FullActor).getDepartments();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCourses() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as unknown as FullActor).getCourses();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useStudents() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as unknown as FullActor).getStudents();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllResults() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allResults"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as unknown as FullActor).getAllResults();
    },
    enabled: !!actor && !isFetching,
  });
}
