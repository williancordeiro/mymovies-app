import { useQuery } from "@tanstack/react-query";

import { getMovieById, getMovies } from "../api/movie";

export const movieKeys = {
  all: ["movies"] as const,
  list: () => [...movieKeys.all, "list"] as const,
  detail: (id: number) => [...movieKeys.all, "detail", id] as const,
};

export function useMovies() {
  return useQuery({
    queryKey: movieKeys.list(),
    queryFn: getMovies,
  });
}

export function useMovie(id: number) {
  return useQuery({
    queryKey: movieKeys.detail(id),
    queryFn: () => getMovieById(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}
