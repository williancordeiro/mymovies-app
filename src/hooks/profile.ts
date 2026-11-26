import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getMyProfile,
  toProfile,
  updateAvatar,
  updateProfile,
} from "../api/profile";
import {
  getSession,
  replaceSession,
  SessionReplacedError,
  SessionStorageError,
} from "../session/authSession";
import {
  ProfileError,
  UpdateProfileError,
  type AvatarUploadInput,
  type Profile,
  type UpdatedProfileResponse,
  type UpdateProfileInput,
} from "../utils/profile";
import { useAuthSession } from "./auth";

export const profileKeys = {
  all: ["profile"] as const,
  me: (userId: number | undefined, token: string | undefined) =>
    [...profileKeys.all, "me", userId, token] as const,
};

export function useProfile() {
  const queryClient = useQueryClient();
  const { session, isRestored } = useAuthSession();
  const token = session?.token;
  const queryKey = profileKeys.me(session?.user.id, token);

  return useQuery<Profile, ProfileError>({
    queryKey,
    enabled: isRestored && Boolean(token),
    staleTime: 0,
    retry: (failureCount, error) =>
      error.kind !== "unauthorized" && failureCount < 2,
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
        const profileError =
          error instanceof ProfileError
            ? error
            : new ProfileError({
                message: "Não foi possível carregar perfil. Tente novamente.",
                kind: "general",
              });

        if (profileError.kind === "unauthorized") {
          void queryClient.cancelQueries({ queryKey, exact: true });
        }

        throw profileError;
      }
    },
  });
}

function sessionUnavailableError(): UpdateProfileError {
  return new UpdateProfileError({
    message: "Sua sessão expirou. Entre novamente.",
    kind: "unauthorized",
  });
}

function toSessionUpdateError(error: unknown): UpdateProfileError {
  if (error instanceof UpdateProfileError) return error;

  if (error instanceof SessionReplacedError) {
    return new UpdateProfileError({ message: error.message, kind: "unauthorized" });
  }

  if (error instanceof SessionStorageError) {
    return new UpdateProfileError({ message: error.message, kind: "general" });
  }

  return new UpdateProfileError({
    message: "Não foi possível atualizar o perfil. Tente novamente.",
    kind: "general",
  });
}

function useProfileUpdateMutation<TInput>(
  mutationFn: (input: TInput) => Promise<UpdatedProfileResponse>,
) {
  const queryClient = useQueryClient();

  return useMutation<UpdatedProfileResponse, UpdateProfileError, TInput>({
    mutationFn: async (input) => {
      const session = getSession();
      if (!session) throw sessionUnavailableError();

      try {
        const response = await mutationFn(input);
        const previousQueryKey = profileKeys.me(session.user.id, session.token);

        await queryClient.cancelQueries({
          queryKey: previousQueryKey,
          exact: true,
        });
        const updatedSession = await replaceSession(response, session.token);

        queryClient.setQueryData(
          profileKeys.me(updatedSession.user.id, updatedSession.token),
          toProfile(updatedSession.user),
        );
        queryClient.removeQueries({
          queryKey: previousQueryKey,
          exact: true,
          type: "inactive",
        });

        return response;
      } catch (error) {
        throw toSessionUpdateError(error);
      }
    },
  });
}

export function useUpdateProfile() {
  return useProfileUpdateMutation<UpdateProfileInput>(updateProfile);
}

export function useUpdateAvatar() {
  return useProfileUpdateMutation<AvatarUploadInput>(updateAvatar);
}
