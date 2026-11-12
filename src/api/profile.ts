import { api } from "../interceptor/api";
import { toProfileError, type Profile } from "../utils/profile";

type ProfileResponse = {
  id: number;
  username: string;
  handle: string;
  email: string;
  role: string;
  avatar_file: string | null;
  banner_file: string | null;
};

function toProfile(profile: ProfileResponse): Profile {
  return {
    id: profile.id,
    username: profile.username,
    handle: profile.handle,
    email: profile.email,
    role: profile.role,
    avatarFile: profile.avatar_file,
    bannerFile: profile.banner_file,
  };
}

export async function getMyProfile(): Promise<Profile> {
  try {
    const { data } = await api.get<ProfileResponse>("/profile");
    return toProfile(data);
  } catch (error) {
    throw toProfileError(error, "perfil");
  }
}
