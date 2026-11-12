import { api } from "../interceptor/api";
import { toProfileError, type UserRating } from "../utils/profile";

type UserRatingsResponse = {
  ratings: {
    movie_id: number;
    rating: number | null;
  }[];
};

export async function getUserRatings(handle: string): Promise<UserRating[]> {
  const normalizedHandle = handle.trim();

  if (!normalizedHandle) {
    return [];
  }

  try {
    const { data } = await api.get<UserRatingsResponse>(
      `/users/${encodeURIComponent(normalizedHandle)}/ratings`,
      { skipAuth: true },
    );

    return data.ratings.map(({ movie_id, rating }) => ({
      movieId: movie_id,
      rating,
    }));
  } catch (error) {
    throw toProfileError(error, "avaliações");
  }
}
