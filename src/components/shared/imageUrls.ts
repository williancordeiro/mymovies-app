export function resolveAvatarUri(
  avatarFile: string | null | undefined,
): string | null {
  if (!avatarFile) return null;

  try {
    return new URL(avatarFile).toString();
  } catch {}

  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) return null;

  try {
    return new URL(avatarFile, new URL(apiUrl).origin).toString();
  } catch {
    return null;
  }
}

export function resolveMovieImageUrl(
  path: string | null | undefined,
  size: "w342" | "w500" | "w1280",
): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;

  const normalizedPath = path.replace(/^\/+/, "");
  return normalizedPath
    ? `https://image.tmdb.org/t/p/${size}/${normalizedPath}`
    : null;
}
