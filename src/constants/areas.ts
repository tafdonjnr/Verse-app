// src/constants/areas.ts

/**
 * Single source of truth for Abuja area names used across:
 * - Attendee profile edit (location picker)
 * - Event creation (venue area tagging — future)
 * - Discovery "Near You" query logic (backend adjacency lookup)
 *
 * IMPORTANT: Area name strings must match exactly between ABUJA_AREAS
 * and the keys/values in AREA_NEARBY_MAP. Do not rename an area here
 * without updating both.
 */

export const ABUJA_AREAS = [
    "Wuse",
    "Wuse 2",
    "Maitama",
    "Asokoro",
    "Garki",
    "CBD",
    "Jabi",
    "Utako",
    "Gwarinpa",
    "Kubwa",
    "Lokogoma",
    "Gudu",
    "Karu",
    "Nyanya",
    "Jikwoyi",
    "Lugbe",
    "Kaura",
    "Apo",
    "Galadimawa",
    "Katampe",
    "Life Camp",
    "Dawaki",
    "Other",
  ] as const;
  
  export type AbujaArea = typeof ABUJA_AREAS[number];
  
  /**
   * Adjacency map for "Near You" discovery logic.
   * Every key listed here corresponds 1:1 to an entry in ABUJA_AREAS.
   * Areas not listed as keys fall through to an empty array — they rely
   * on Tier 3 (phase-level) fallback or exact-area match only.
   *
   * Resolved from the original draft:
   * - "Area 1" → replaced with "Apo" (closest real entry, both south of Garki)
   * - "Airport Road" → replaced with "Lugbe" self-removed from its own
   *   adjacency list (an area is not its own neighbor)
   */
  export const AREA_NEARBY_MAP: Record<string, string[]> = {
    // Phase 1 core — central, high-density
    Wuse:      ["Maitama", "CBD", "Garki", "Jabi", "Utako", "Wuse 2"],
    "Wuse 2":  ["Wuse", "Jabi", "Utako"],
    Maitama:   ["Wuse", "Asokoro", "CBD"],
    Asokoro:   ["Maitama", "Garki"],
    CBD:       ["Wuse", "Garki", "Maitama"],
    Garki:     ["Wuse", "CBD", "Asokoro", "Apo"],
  
    // Phase 2 connectors
    Jabi:      ["Wuse", "Utako", "Gwarinpa", "Wuse 2"],
    Utako:     ["Wuse", "Jabi", "Wuse 2"],
    Gwarinpa:  ["Jabi", "Kubwa"],
    Kubwa:     ["Gwarinpa"],
  
    // Karu / Nyanya corridor — bridges into Phase 1/2 rather than isolated
    Karu:      ["Nyanya", "Jikwoyi", "Garki", "Wuse"],
    Nyanya:    ["Karu", "Jikwoyi", "Garki"],
    Jikwoyi:   ["Karu", "Nyanya"],
  
    // South corridor
    Lugbe:     ["Garki", "Kaura", "Apo"],
    Kaura:     ["Lugbe", "Apo"],
    Apo:       ["Garki", "Lugbe", "Kaura"],
  
    // Phase bridging
    Lokogoma:  ["Gudu", "Garki"],
    Gudu:      ["Garki", "Lokogoma"],
  
    // No adjacency data yet — intentional, not an oversight.
    // These fall back to exact-area match + phase-level fallback only.
    Galadimawa: [],
    Katampe:    [],
    "Life Camp": [],
    Dawaki:      [],
    Other:       [],
  };
  
  /**
   * Returns the list of nearby area names for a given area.
   * Returns an empty array (not undefined) if the area has no adjacency
   * data yet, so callers never need to null-check.
   */
  export function getNearbyAreas(area: string | undefined | null): string[] {
    if (!area) return [];
    return AREA_NEARBY_MAP[area] ?? [];
  }