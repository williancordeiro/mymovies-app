import { useQuery } from "@tanstack/react-query";

import { getMovieById, getMovies, searchMovies } from "../api/movie";

export const movieKeys = {
  all: ["movies"] as const,
  list: () => [...movieKeys.all, "list"] as const,
  search: (query: string) => [...movieKeys.all, "search", query] as const,
  detail: (id: number) => [...movieKeys.all, "detail", id] as const,
};

export function useMovieSearch(query: string) {
  const term = query.trim();
  return useQuery({
    queryKey: movieKeys.search(term),
    queryFn: ({ signal }) => searchMovies(term, signal),
    enabled: term.length >= 3,
  });
}

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
