export const profileKeys = {
  all: ["profile"] as const,
  me: (userId: number | undefined, token: string | undefined) =>
    [...profileKeys.all, "me", userId, token] as const,
};
