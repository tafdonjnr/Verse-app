import {
  View,
  Text,
  FlatList,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { router } from "expo-router";
import { colors, fonts, radius, getCategoryTheme } from "@/src/theme";
import { useAuthStore } from "@/src/store/auth-store";
import { getNearbyAreas } from "@/src/constants/areas";

const BASE_URL = "https://eventapp-ju5c.onrender.com";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CATEGORIES = [
  "all",
  "festival",
  "concert",
  "color-festival",
  "funfair",
  "rave",
  "popup",
  "sports",
  "trade-fair",
  "food-festival",
  "outdoor",
];

const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  festival: "Festival",
  concert: "Concert",
  "color-festival": "Color Festival",
  funfair: "Funfair",
  rave: "Rave / Party",
  popup: "Pop-up / Souk",
  sports: "Sports",
  "trade-fair": "Trade Fair",
  "food-festival": "Food Festival",
  outdoor: "Outdoor",
};

type Event = {
  _id: string;
  title: string;
  date: string;
  venue?: string;
  area?: string;
  price?: number;
  category?: string;
  banner?: string;
  description?: string;
  ticketsAvailable?: number;
  organizer?: { orgName?: string; _id?: string } | string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatTime = (d: string) =>
  new Date(d).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatPrice = (price: any) =>
  price === undefined || price === null || price === 0
    ? "Free"
    : `₦${Number(price).toLocaleString()}`;

const getOrgName = (organizer: Event["organizer"]) => {
  if (!organizer) return "";
  if (typeof organizer === "string") return "";
  return organizer.orgName ?? "";
};

// ─── Compact horizontal card ──────────────────────────────────────────────────

function CompactCard({ item }: { item: Event }) {
  const theme = getCategoryTheme(item.category);
  return (
    <Pressable
      style={styles.compactCard}
      onPress={() => router.push(`/attendee/event/${item._id}` as any)}
    >
      {item.banner ? (
        <Image
          source={{ uri: item.banner }}
          style={styles.compactBanner}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.compactBanner, { backgroundColor: theme.bg + "33" }]} />
      )}
      <View style={[styles.compactCategoryStrip, { backgroundColor: theme.bg }]} />
      <View style={styles.compactBody}>
        <Text style={styles.compactTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.compactDate}>
          {new Date(item.date).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
          })}
        </Text>
        {item.area ? (
          <Text style={styles.compactArea}>📍 {item.area}</Text>
        ) : null}
        <Text style={[styles.compactPrice, { color: theme.bg }]}>
          {formatPrice(item.price)}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Horizontal section ───────────────────────────────────────────────────────

function HorizontalSection({
  label,
  sublabel,
  data,
  onSeeAll,
}: {
  label: string;
  sublabel?: string;
  data: Event[];
  onSeeAll?: () => void;
}) {
  if (!data.length) return null;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <Text style={styles.sectionLabel}>{label}</Text>
          {sublabel ? (
            <Text style={styles.sectionSublabel}>{sublabel}</Text>
          ) : null}
        </View>
        {onSeeAll && (
          <Pressable onPress={onSeeAll}>
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      >
        {data.slice(0, 6).map((item) => (
          <CompactCard key={item._id} item={item} />
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Vertical event card ──────────────────────────────────────────────────────

function EventCard({ item }: { item: Event }) {
  const theme = getCategoryTheme(item.category);
  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/attendee/event/${item._id}` as any)}
    >
      <View style={[styles.cardStrip, { backgroundColor: theme.bg }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <View style={[styles.dateBlock, { backgroundColor: theme.bg + "22" }]}>
            <Text style={[styles.dateDay, { color: theme.bg }]}>
              {new Date(item.date).getDate()}
            </Text>
            <Text style={[styles.dateMonth, { color: theme.bg }]}>
              {new Date(item.date).toLocaleString("en-NG", { month: "short" })}
            </Text>
          </View>
          <View style={styles.cardInfo}>
            <View style={[styles.tagBadge, { backgroundColor: theme.bg + "22" }]}>
              <Text style={[styles.tagBadgeText, { color: theme.bg }]}>
                {item.category?.toUpperCase() ?? "GENERAL"}
              </Text>
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.cardMeta} numberOfLines={1}>
              {formatTime(item.date)}
              {item.venue ? `  ·  ${item.venue}` : ""}
              {item.area ? `  ·  ${item.area}` : ""}
            </Text>
          </View>
          {item.banner ? (
            <Image
              source={{ uri: item.banner }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.thumbnail, { backgroundColor: theme.bg + "22" }]} />
          )}
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.cardOrg}>{getOrgName(item.organizer)}</Text>
          <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function DiscoveryScreen() {
  const user = useAuthStore((s) => s.user);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [thisWeek, setThisWeek] = useState<Event[]>([]);
  const [freeEvents, setFreeEvents] = useState<Event[]>([]);
  const [trendingEvents, setTrendingEvents] = useState<Event[]>([]);
  const [nearYouEvents, setNearYouEvents] = useState<Event[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Get user's area and build the nearby areas list from the adjacency map
  const userArea = (user as any)?.location?.area ?? "";
  const nearbyAreas = userArea
    ? [userArea, ...getNearbyAreas(userArea)]
    : [];

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const now = new Date();
      const weekEnd = new Date();
      weekEnd.setDate(now.getDate() + 7);

      // Build Near You URL — only fetch if user has a location set
      const nearYouUrl =
        nearbyAreas.length > 0
          ? `${BASE_URL}/api/events?areas=${encodeURIComponent(nearbyAreas.join(","))}`
          : null;

      const fetches: Promise<Response>[] = [
        fetch(`${BASE_URL}/api/events`),
        fetch(`${BASE_URL}/api/events?from=${now.toISOString()}&to=${weekEnd.toISOString()}`),
        fetch(`${BASE_URL}/api/events?type=free`),
        fetch(`${BASE_URL}/api/events?sort=popular`),
      ];

      // Only add Near You fetch if user has location
      if (nearYouUrl) fetches.push(fetch(nearYouUrl));

      const responses = await Promise.all(fetches);
      const jsons = await Promise.all(responses.map((r) => r.json()));

      const toList = (d: any): Event[] =>
        Array.isArray(d) ? d : d.events ?? [];

      setAllEvents(toList(jsons[0]));
      setThisWeek(toList(jsons[1]));
      setFreeEvents(toList(jsons[2]));
      setTrendingEvents(toList(jsons[3]));
      if (nearYouUrl && jsons[4]) setNearYouEvents(toList(jsons[4]));
    } catch (err) {
      console.error("Discovery fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userArea]);

  useEffect(() => {
    fetchAll();
  }, [userArea]);

  const filtered = allEvents.filter((e) => {
    const matchCat =
      activeCategory === "all" ||
      e.category?.toLowerCase() === activeCategory;
    const matchSearch =
      !search.trim() ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.venue?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const heroEvents = [...allEvents]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchAll(true)}
            tintColor={colors.accent}
          />
        }
        ListHeaderComponent={
          <>
            {/* Page header */}
            <View style={styles.pageHeader}>
              <Text style={styles.pageTitle}>Discover</Text>
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
              <TextInput
                placeholder="Search events, venues…"
                placeholderTextColor={colors.textTertiary}
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
              />
            </View>

            {/* Category chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setActiveCategory(cat)}
                    style={[styles.chip, isActive && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {CATEGORY_LABELS[cat] ?? cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Hero carousel */}
            {!search && activeCategory === "all" && heroEvents.length > 0 && (
              <View style={styles.section}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  pagingEnabled
                  contentContainerStyle={styles.heroScroll}
                >
                  {heroEvents.map((event) => {
                    const theme = getCategoryTheme(event.category);
                    return (
                      <Pressable
                        key={event._id}
                        style={styles.heroCard}
                        onPress={() =>
                          router.push(`/attendee/event/${event._id}` as any)
                        }
                      >
                        {event.banner ? (
                          <Image
                            source={{ uri: event.banner }}
                            style={styles.heroBanner}
                            resizeMode="cover"
                          />
                        ) : (
                          <View
                            style={[
                              styles.heroBanner,
                              { backgroundColor: theme.bg + "33" },
                            ]}
                          />
                        )}
                        <View style={styles.heroOverlay}>
                          <View
                            style={[
                              styles.heroCategoryPill,
                              { backgroundColor: theme.bg },
                            ]}
                          >
                            <Text style={styles.heroCategoryText}>
                              {event.category?.toUpperCase() ?? "GENERAL"}
                            </Text>
                          </View>
                          <View style={styles.heroInfo}>
                            <Text style={styles.heroEventTitle} numberOfLines={2}>
                              {event.title}
                            </Text>
                            <View style={styles.heroMeta}>
                              <Text style={styles.heroMetaText}>
                                {formatDate(event.date)}
                              </Text>
                              {event.venue ? (
                                <Text style={styles.heroMetaText}>
                                  · {event.venue}
                                </Text>
                              ) : null}
                              {event.area ? (
                                <Text style={styles.heroMetaText}>
                                  · {event.area}
                                </Text>
                              ) : null}
                            </View>
                            <Text style={styles.heroPrice}>
                              {formatPrice(event.price)}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Near You — only shown when user has location set */}
            {!search && activeCategory === "all" && nearYouEvents.length > 0 && (
              <HorizontalSection
                label="NEAR YOU"
                sublabel={userArea ? `Around ${userArea}` : undefined}
                data={nearYouEvents}
              />
            )}

            {/* Prompt to set location if no area set */}
            {!search && activeCategory === "all" && !userArea && (
              <Pressable
                style={styles.locationPrompt}
                onPress={() => router.push("/attendee/edit-profile" as any)}
              >
                <Text style={styles.locationPromptText}>
                  📍 Set your area to see events near you
                </Text>
                <Text style={styles.locationPromptCta}>Update profile →</Text>
              </Pressable>
            )}

            {/* Trending */}
            {!search && activeCategory === "all" && (
              <HorizontalSection
                label="TRENDING"
                data={trendingEvents}
              />
            )}

            {/* This Week */}
            {!search && activeCategory === "all" && (
              <HorizontalSection
                label="THIS WEEK"
                data={thisWeek}
              />
            )}

            {/* Free Events */}
            {!search && activeCategory === "all" && (
              <HorizontalSection
                label="FREE EVENTS"
                data={freeEvents}
                onSeeAll={() => setActiveCategory("all")}
              />
            )}

            {filtered.length > 0 && (
              <View style={styles.sectionHeader2}>
                <Text style={styles.sectionLabel}>
                  {search || activeCategory !== "all" ? "RESULTS" : "ALL EVENTS"}
                </Text>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No events found</Text>
            <Text style={styles.emptySub}>
              Try a different category or search term
            </Text>
          </View>
        }
        renderItem={({ item }) => <EventCard item={item} />}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pageBg },
  center: { justifyContent: "center", alignItems: "center" },
  listContent: { paddingBottom: 120 },

  pageHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 },
  pageTitle: {
    fontFamily: fonts.frauncesBlack,
    fontSize: 32,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },

  searchRow: { paddingHorizontal: 20, marginBottom: 14 },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: fonts.dmSans,
    fontSize: 14,
    color: colors.textPrimary,
  },

  chipRow: { paddingHorizontal: 20, gap: 8, paddingBottom: 20 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    fontFamily: fonts.dmSansMedium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: "#0A0A0A",
    fontFamily: fonts.dmSansBold,
  },

  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionHeaderLeft: { gap: 2 },
  sectionHeader2: { paddingHorizontal: 20, marginBottom: 12 },
  sectionLabel: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 11,
    color: colors.textTertiary,
    letterSpacing: 1.5,
  },
  sectionSublabel: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    color: colors.textSecondary,
  },
  seeAll: {
    fontFamily: fonts.dmSansMedium,
    fontSize: 13,
    color: colors.accent,
  },
  horizontalList: { paddingHorizontal: 20, gap: 12 },

  // Location prompt
  locationPrompt: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  locationPromptText: {
    fontFamily: fonts.dmSans,
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  locationPromptCta: {
    fontFamily: fonts.dmSansBold,
    fontSize: 13,
    color: colors.accent,
  },

  heroScroll: { paddingHorizontal: 20, gap: 12 },
  heroCard: {
    width: SCREEN_WIDTH - 40,
    height: 220,
    borderRadius: radius.xxl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
  },
  heroBanner: { width: "100%", height: "100%" },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  heroCategoryPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  heroCategoryText: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 9,
    color: "#fff",
    letterSpacing: 1,
  },
  heroInfo: { gap: 4 },
  heroEventTitle: {
    fontFamily: fonts.frauncesBold,
    fontSize: 20,
    color: "#fff",
    lineHeight: 26,
  },
  heroMeta: { flexDirection: "row", gap: 4, flexWrap: "wrap" },
  heroMetaText: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
  },
  heroPrice: {
    fontFamily: fonts.frauncesBold,
    fontSize: 16,
    color: colors.accent,
    marginTop: 2,
  },

  compactCard: {
    width: 160,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  compactBanner: { width: "100%", height: 100 },
  compactCategoryStrip: { height: 3, width: "100%" },
  compactBody: { padding: 10, gap: 3 },
  compactTitle: {
    fontFamily: fonts.frauncesBold,
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 17,
  },
  compactDate: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  compactArea: {
    fontFamily: fonts.dmSans,
    fontSize: 10,
    color: colors.textTertiary,
  },
  compactPrice: {
    fontFamily: fonts.frauncesBold,
    fontSize: 13,
    marginTop: 2,
  },

  card: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  cardStrip: { height: 3, width: "100%" },
  cardBody: { padding: 14 },
  cardRow: { flexDirection: "row", gap: 12, marginBottom: 10 },
  dateBlock: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  dateDay: { fontFamily: fonts.frauncesBold, fontSize: 18, lineHeight: 20 },
  dateMonth: { fontFamily: fonts.dmMonoMedium, fontSize: 9, letterSpacing: 0.5 },
  cardInfo: { flex: 1, gap: 4 },
  tagBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  tagBadgeText: { fontFamily: fonts.dmMonoMedium, fontSize: 9, letterSpacing: 0.8 },
  cardTitle: {
    fontFamily: fonts.frauncesBold,
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  cardMeta: { fontFamily: fonts.dmSans, fontSize: 12, color: colors.textSecondary },
  thumbnail: { width: 52, height: 52, borderRadius: radius.md, flexShrink: 0 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  cardOrg: { fontFamily: fonts.dmSans, fontSize: 12, color: colors.textTertiary },
  cardPrice: { fontFamily: fonts.frauncesBold, fontSize: 15, color: colors.accent },

  emptyWrap: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 32, marginBottom: 4, opacity: 0.4 },
  emptyTitle: {
    fontFamily: fonts.frauncesBold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  emptySub: {
    fontFamily: fonts.dmSans,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
});