import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Role = "attendee" | "organizer" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  orgName?: string;
  logo?: string;
  avatar?: string;
  username?: string;
  bio?: string;
  location?: { city: string; area: string };
  showAttendance?: boolean;
};

type AuthState = {
  user: User | null;
  token: string | null;
  selectedRole: Role | null;
  setSelectedRole: (role: Role) => void;
  setUser: (user: User, token: string) => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  selectedRole: null,

  setSelectedRole: (role) => {
    set({ selectedRole: role });
  },

  setUser: (user, token) => {
    AsyncStorage.setItem("user", JSON.stringify(user));
    AsyncStorage.setItem("token", token);
    set({ user, token });
  },

  logout: async () => {
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("token");
    set({ user: null, token: null, selectedRole: null });
  },

  hydrate: async () => {
    const user = await AsyncStorage.getItem("user");
    const token = await AsyncStorage.getItem("token");
    if (user && token) {
      set({ user: JSON.parse(user) as User, token });
    }
  },
}));

/** Map a backend attendee profile/document into a stored User */
export function mapAttendeeToUser(
  profile: Record<string, unknown>,
  role: Role = "attendee"
): User {
  return {
    id: String(profile._id ?? profile.id ?? ""),
    name: String(profile.name ?? ""),
    email: String(profile.email ?? ""),
    role,
    phone: profile.phone ? String(profile.phone) : undefined,
    avatar: profile.avatar ? String(profile.avatar) : undefined,
    username: profile.username ? String(profile.username) : undefined,
    bio: profile.bio ? String(profile.bio) : undefined,
    location: profile.location as User["location"] | undefined,
    showAttendance:
      typeof profile.showAttendance === "boolean"
        ? profile.showAttendance
        : undefined,
  };
}
