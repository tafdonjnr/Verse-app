export const colors = {
  // Core backgrounds
  accent:        "#CAFF00",
  accentLight:   "#CAFF0022",
  accentMid:     "#CAFF0044",
  pageBg:        "#0A0A0A",
  surface:       "#141414",
  surface2:      "#1C1C1C",
  border:        "#242424",

  // Text
  textPrimary:   "#F0F0F0",
  textSecondary: "#666666",
  textTertiary:  "#333333",

  // Misc
  white:         "#FFFFFF",
  gold:          "#FFB800",
  inputBg:       "#141414",
  inputBorder:   "#242424",
  divider:       "#1C1C1C",
  roleBg:        "#0E0E0F",
  ticketBg:      "#0A0A0A",
};

export const categories = {
  festival: {
    bg:       "#FFB800",
    light:    "#FFB80020",
    text:     "#FFB800",
    gradient: ["#FFB800", "#FBBF24"] as const,
  },
  concert: {
    bg:       "#CAFF00",
    light:    "#CAFF0020",
    text:     "#CAFF00",
    gradient: ["#CAFF00", "#A3E635"] as const,
  },
  "color-festival": {
    bg:       "#FF2D55",
    light:    "#FF2D5520",
    text:     "#FF2D55",
    gradient: ["#FF2D55", "#F472B6"] as const,
  },
  funfair: {
    bg:       "#D97706",
    light:    "#D9770620",
    text:     "#D97706",
    gradient: ["#D97706", "#FBBF24"] as const,
  },
  rave: {
    bg:       "#7C3AED",
    light:    "#7C3AED20",
    text:     "#7C3AED",
    gradient: ["#7C3AED", "#A78BFA"] as const,
  },
  popup: {
    bg:       "#0D9488",
    light:    "#0D948820",
    text:     "#0D9488",
    gradient: ["#0D9488", "#2DD4BF"] as const,
  },
  sports: {
    bg:       "#00E676",
    light:    "#00E67620",
    text:     "#00E676",
    gradient: ["#00E676", "#4ADE80"] as const,
  },
  "trade-fair": {
    bg:       "#3B82F6",
    light:    "#3B82F620",
    text:     "#3B82F6",
    gradient: ["#3B82F6", "#93C5FD"] as const,
  },
  "food-festival": {
    bg:       "#FF2D55",
    light:    "#FF2D5520",
    text:     "#FF2D55",
    gradient: ["#FF2D55", "#FB923C"] as const,
  },
  outdoor: {
    bg:       "#00E676",
    light:    "#00E67620",
    text:     "#00E676",
    gradient: ["#00E676", "#4ADE80"] as const,
  },
  tech: {
    bg:       "#00CFFF",
    light:    "#00CFFF20",
    text:     "#00CFFF",
    gradient: ["#00CFFF", "#38BDF8"] as const,
  },
  general: {
    bg:       "#666666",
    light:    "#66666620",
    text:     "#666666",
    gradient: ["#666666", "#888888"] as const,
  },
} as const;

export type CategoryKey = keyof typeof categories;

export const getCategoryTheme = (cat?: string) => {
  if (!cat) return categories.general;
  const key = cat
    .toLowerCase()
    .replace(/\s*\/\s*/g, "-")
    .replace(/\s+/g, "-") as CategoryKey;
  return categories[key] ?? categories.general;
};

export const fonts = {
  fraunces:       "Fraunces_400Regular",
  frauncesBold:   "Fraunces_700Bold",
  frauncesBlack:  "Fraunces_900Black",
  fraunces900:    "Fraunces_900Black",
  dmSans:         "DMSans_400Regular",
  dmSansMedium:   "DMSans_500Medium",
  dmSansSemiBold: "DMSans_600SemiBold",
  dmSansBold:     "DMSans_700Bold",
  dmMono:         "DMMono_400Regular",
  dmMonoMedium:   "DMMono_500Medium",
};

export const radius = {
  sm:    8,
  md:    12,
  lg:    14,
  xl:    18,
  xxl:   20,
  sheet: 28,
  phone: 50,
};

export const shadows = {
  card: {
    shadowColor:   "#000",
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius:  8,
    elevation:     4,
  },
  sheet: {
    shadowColor:   "#000",
    shadowOffset:  { width: 0, height: -8 },
    shadowOpacity: 0.5,
    shadowRadius:  24,
    elevation:     16,
  },
};