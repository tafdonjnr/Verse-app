const BASE_URL = "https://eventapp-ju5c.onrender.com";

/** Resolve organizer logo — supports Cloudinary URLs and legacy /uploads paths */
export function resolveOrganizerLogo(logo?: string | null): string | null {
  if (!logo) return null;
  if (logo.startsWith("http://") || logo.startsWith("https://")) return logo;
  return `${BASE_URL}/uploads/${logo.replace(/^\//, "")}`;
}
