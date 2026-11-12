import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getMyProfile } from "../api/profile";
import { getSession } from "../session/authSession";
import { ProfileError, type Profile } from "../utils/profile";

export const profileKeys = {
  all: ["profile"] as const,
  me: (userId: number | undefined, token: string | undefined) =>
    [...profileKeys.all, "me", userId, token] as const,
};

export function useProfile() {
  const queryClient = useQueryClient();
  const session = getSession();
  const token = session?.token;
  const queryKey = profileKeys.me(session?.user.id, token);

  return useQuery<Profile, ProfileError>({
    queryKey,
    enabled: Boolean(token),
    staleTime: 0,
    retry: (failureCount, error) => error.kind !== "unauthorized" && failureCount < 2,
    queryFn: async () => {
      try {
        const profile = await getMyProfile();

        if (getSession()?.token !== token) {
          throw new ProfileError({
            message: "Sua sessão expirou. Entre novamente.",
            kind: "unauthorized",
          });
        }

        return profile;
      } catch (error) {
        const profileError = error instanceof ProfileError
          ? error
          : new ProfileError({
              message: "Não foi possível carregar perfil. Tente novamente.",
              kind: "general",
            });

        if (profileError.kind === "unauthorized") {
          queryClient.removeQueries({ queryKey, exact: true });
        }

        throw profileError;
      }
    },
  });
}
