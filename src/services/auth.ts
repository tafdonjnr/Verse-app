import { mapAttendeeToUser, type Role, type User } from "@/src/store/auth-store";

const BASE_URL = "https://eventapp-ju5c.onrender.com";

type LoginPayload = {
  email: string;
  password: string;
  role: "attendee" | "organizer";
};

export const loginUser = async ({
  email,
  password,
  role,
}: LoginPayload): Promise<{ user: User; token: string }> => {
  const endpoint =
    role === "organizer"
      ? "/api/organizers/login"
      : "/api/attendees/login";

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Login failed");
  }

  const raw = data.user || data.attendee || data.organizer;
  const token: string = data.token;

  if (role === "attendee") {
    try {
      const profileRes = await fetch(`${BASE_URL}/api/attendees/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        return { user: mapAttendeeToUser(profile, "attendee"), token };
      }
    } catch {
      // fall through to basic user from login response
    }
  }

  return {
    user: {
      id: String(raw.id ?? raw._id ?? ""),
      name: raw.name,
      email: raw.email,
      role: role as Role,
      phone: raw.phone,
      orgName: raw.orgName,
      logo: raw.logo,
    },
    token,
  };
};
