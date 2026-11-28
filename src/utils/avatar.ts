import type { AvatarUploadInput } from "./profile";

export const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const AVATAR_MAX_DIMENSION = 4096;
export const AVATAR_MAX_PIXELS = 16_000_000;

export const AVATAR_REQUIREMENTS_MESSAGE =
  "Selecione uma imagem JPG, JPEG ou PNG de até 5 MiB, com no máximo 4.096 × 4.096 px e 16 MP.";

export function getAvatarInputError(input: AvatarUploadInput): string | null {
  const extension = input.name.split(".").pop()?.toLowerCase();
  const validFormat =
    (input.mimeType === "image/jpeg" &&
      (extension === "jpg" || extension === "jpeg")) ||
    (input.mimeType === "image/png" && extension === "png");

  if (!input.uri || !input.name || !validFormat) {
    return AVATAR_REQUIREMENTS_MESSAGE;
  }

  if (input.size !== undefined && input.size > AVATAR_MAX_SIZE_BYTES) {
    return "Escolha uma imagem de até 5 MiB.";
  }

  if (input.width !== undefined || input.height !== undefined) {
    if (
      input.width === undefined ||
      input.height === undefined ||
      !Number.isFinite(input.width) ||
      !Number.isFinite(input.height) ||
      input.width <= 0 ||
      input.height <= 0 ||
      input.width > AVATAR_MAX_DIMENSION ||
      input.height > AVATAR_MAX_DIMENSION ||
      input.width * input.height > AVATAR_MAX_PIXELS
    ) {
      return "Escolha uma imagem com até 4.096 × 4.096 px e 16 MP.";
    }
  }

  return null;
}
