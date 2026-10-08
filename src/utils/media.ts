import { API_BASE_URL } from "@/src/services/api";

/** Resolve backend media paths to absolute URLs for Image sources. */
export function resolveMediaUrl(path?: string | null): string | null {
  if (!path || !path.trim()) return null;

  const trimmed = path.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("file:")
  ) {
    return trimmed;
  }

  return `${API_BASE_URL}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

export function resolveOrganizerLogo(logo?: string | null): string | null {
  return resolveMediaUrl(logo);
}
