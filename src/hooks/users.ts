import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getMovieById } from "../api/movie";
import { getUserRatings } from "../api/users";
import {
  toProfileError,
  type ProfileError,
  type ProfileMovieRating,
  type UserRating,
} from "../utils/profile";
import { useAuthSession } from "./auth";
import { getMovieSessionScope, movieKeys } from "./movie";

export const userKeys = {
  all: ["users"] as const,
  ratings: (handle: string) => [...userKeys.all, "ratings", handle] as const,
};

async function mapWithConcurrency<T, R>(
  values: readonly T[],
  limit: number,
  mapper: (value: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < values.length) {
      const index = nextIndex++;
      results[index] = await mapper(values[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, worker),
  );
  return results;
}

export function useUserRatings(handle: string | undefined) {
  const queryClient = useQueryClient();
  const { session, generation, isRestored } = useAuthSession();
  const movieScope = getMovieSessionScope(session?.user.id, generation);
  const normalizedHandle = handle?.trim() ?? "";

  return useQuery<ProfileMovieRating[], ProfileError>({
    queryKey: userKeys.ratings(normalizedHandle),
    enabled: isRestored && normalizedHandle.length > 0,
    retry: (failureCount, error) =>
      error.kind !== "unauthorized" &&
      error.kind !== "notFound" &&
      failureCount < 2,
    queryFn: async () => {
      try {
        const ratings = await getUserRatings(normalizedHandle);
        const ratingsToEnrich = ratings.slice(0, 3);

        return mapWithConcurrency<UserRating, ProfileMovieRating>(
          ratingsToEnrich,
          2,
          async (rating) => {
            const movie = await queryClient.fetchQuery({
              queryKey: movieKeys.detail(movieScope, rating.movieId),
              queryFn: () => getMovieById(rating.movieId),
            });

            return {
              ...rating,
              title: movie.title,
              posterPath: movie.poster_path,
            };
          },
        );
      } catch (error) {
        throw toProfileError(error, "avaliações");
      }
    },
  });
}
