import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { colors, fonts, radius, getCategoryTheme, shadows } from "@/src/theme";
import { useAuthStore } from "@/src/store/auth-store";

const BASE_URL = "https://eventapp-ju5c.onrender.com";
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
  all:              "All",
  festival:         "Festival",
  concert:          "Concert",
  "color-festival": "Color Festival",
  funfair:          "Funfair",
  rave:             "Rave / Party",
  popup:            "Pop-up / Souk",
  sports:           "Sports",
  "trade-fair":     "Trade Fair",
  "food-festival":  "Food Festival",
  outdoor:          "Outdoor",
};

type Event = {
  _id: string;
  title: string;
  date: string;
  venue?: string;
  price?: number;
  category?: string;
  banner?: string;
  description?: string;
  ticketsAvailable?: number;
  organizer?: { orgName?: string; _id?: string } | string;
};

export default function AttendeeHome() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filtered, setFiltered] = useState<Event[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const user = useAuthStore((s) => s.user);

  const fetchEvents = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    fetch(`${BASE_URL}/api/events`)
      .then((r) => r.json())
      .then((data) => {
        const now = new Date();
        const list = (Array.isArray(data) ? data : data.events ?? []).filter(
          (e: Event) => new Date(e.date) >= now
        );
        setEvents(list);
        setFiltered(list);
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    let result = events;
    if (activeCategory !== "all") {
      result = result.filter(
        (e) => e.category?.toLowerCase() === activeCategory
      );
    }
    if (search.trim()) {
      result = result.filter((e) =>
        e.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(result);
  }, [search, activeCategory, events]);

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "GOOD MORNING";
    if (hour < 17) return "GOOD AFTERNOON";
    return "GOOD EVENING";
  };

  const getOrgName = (organizer: Event["organizer"]) => {
    if (!organizer) return "";
    if (typeof organizer === "string") return "";
    return organizer.orgName ?? "";
  };

  const featuredEvent = filtered[0];
  const listEvents = filtered.slice(1);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={listEvents}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchEvents(true)}
            tintColor={colors.accent}
          />
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>{getGreeting()}</Text>
                <Text style={styles.heroTitle}>
                  {user?.name?.split(" ")[0]
                    ? `Hey, ${user.name.split(" ")[0]}.`
                    : "Discover Events."}
                </Text>
              </View>
              <Pressable
                style={styles.avatar}
                onPress={() => router.push("/attendee/profile" as any)}
              >
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarText}>
                    {user?.name?.[0]?.toUpperCase() ?? "V"}
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
              <TextInput
                placeholder="Search events..."
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
                const theme = getCategoryTheme(cat);
                const isActive = activeCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setActiveCategory(cat)}
                    style={[
                      styles.chip,
                      isActive && {
                        backgroundColor:
                          cat === "all" ? colors.accent : theme.bg,
                        borderColor:
                          cat === "all" ? colors.accent : theme.bg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isActive && {
                          color: cat === "all" ? "#0A0A0A" : "#fff",
                        },
                        !isActive && cat !== "all" && { color: theme.text },
                      ]}
                    >
                      {CATEGORY_LABELS[cat] ?? cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Featured hero card */}
            {featuredEvent && (
              <Pressable
                style={styles.heroCard}
                onPress={() =>
                  router.push(`/attendee/event/${featuredEvent._id}` as any)
                }
              >
                {featuredEvent.banner ? (
                  <Image
                    source={{ uri: featuredEvent.banner }}
                    style={styles.heroBanner}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.heroBanner,
                      {
                        backgroundColor:
                          getCategoryTheme(featuredEvent.category).bg + "33",
                      },
                    ]}
                  />
                )}

                <View style={styles.heroOverlay}>
                  <View
                    style={[
                      styles.heroCategoryPill,
                      {
                        backgroundColor: getCategoryTheme(
                          featuredEvent.category
                        ).bg,
                      },
                    ]}
                  >
                    <Text style={styles.heroCategoryText}>
                      {featuredEvent.category?.toUpperCase() ?? "GENERAL"}
                    </Text>
                  </View>

                  <View style={styles.heroInfo}>
                    <Text style={styles.heroEventTitle} numberOfLines={2}>
                      {featuredEvent.title}
                    </Text>
                    <View style={styles.heroMeta}>
                      <Text style={styles.heroMetaText}>
                        {formatDate(featuredEvent.date)}
                      </Text>
                      {featuredEvent.venue ? (
                        <Text style={styles.heroMetaText}>
                          · {featuredEvent.venue}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={styles.heroPrice}>
                      {formatPrice(featuredEvent.price)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            )}

            <Text style={styles.sectionLabel}>UPCOMING EVENTS</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No events found</Text>
          </View>
        }
        renderItem={({ item }) => {
          const theme = getCategoryTheme(item.category);
          return (
            <Pressable
              style={styles.card}
              onPress={() =>
                router.push(`/attendee/event/${item._id}` as any)
              }
            >
              <View
                style={[styles.cardStrip, { backgroundColor: theme.bg }]}
              />

              <View style={styles.cardBody}>
                <View style={styles.cardRow}>
                  <View
                    style={[
                      styles.dateBlock,
                      { backgroundColor: theme.bg + "22" },
                    ]}
                  >
                    <Text style={[styles.dateDay, { color: theme.bg }]}>
                      {new Date(item.date).getDate()}
                    </Text>
                    <Text style={[styles.dateMonth, { color: theme.bg }]}>
                      {new Date(item.date).toLocaleString("en-NG", {
                        month: "short",
                      })}
                    </Text>
                  </View>

                  <View style={styles.cardInfo}>
                    <View
                      style={[
                        styles.tagBadge,
                        { backgroundColor: theme.bg + "22" },
                      ]}
                    >
                      <Text
                        style={[styles.tagBadgeText, { color: theme.bg }]}
                      >
                        {item.category?.toUpperCase() ?? "GENERAL"}
                      </Text>
                    </View>

                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>

                    <Text style={styles.cardMeta} numberOfLines={1}>
                      {formatTime(item.date)}
                      {item.venue ? `  ·  ${item.venue}` : ""}
                    </Text>
                  </View>

                  {item.banner ? (
                    <Image
                      source={{ uri: item.banner }}
                      style={styles.thumbnail}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.thumbnail,
                        { backgroundColor: theme.bg + "22" },
                      ]}
                    />
                  )}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardOrg}>
                    {getOrgName(item.organizer)}
                  </Text>
                  <Text style={styles.cardPrice}>
                    {formatPrice(item.price)}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.pageBg },
  center:     { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60 },
  emptyWrap:  { paddingVertical: 60, alignItems: "center" },
  emptyText:  { fontFamily: fonts.dmSans, color: colors.textTertiary, fontSize: 14 },
  list:       { paddingBottom: 120 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  greeting: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 11,
    color: colors.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: fonts.frauncesBlack,
    fontSize: 28,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 15,
    color: "#0A0A0A",
  },

  searchRow:   { paddingHorizontal: 20, marginBottom: 14 },
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

  chipRow:  { paddingHorizontal: 20, gap: 8, paddingBottom: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipText: {
    fontFamily: fonts.dmSansMedium,
    fontSize: 13,
    color: colors.textSecondary,
  },

  heroCard: {
    marginHorizontal: 20,
    borderRadius: radius.xxl,
    overflow: "hidden",
    height: 210,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroBanner:   { width: "100%", height: "100%" },
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
  heroInfo:       { gap: 4 },
  heroEventTitle: {
    fontFamily: fonts.frauncesBold,
    fontSize: 20,
    color: "#fff",
    lineHeight: 26,
  },
  heroMeta:     { flexDirection: "row", gap: 4 },
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

  sectionLabel: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 11,
    color: colors.textTertiary,
    letterSpacing: 1.5,
    paddingHorizontal: 20,
    marginBottom: 12,
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
  cardStrip:  { height: 3, width: "100%" },
  cardBody:   { padding: 14 },
  cardRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  dateBlock: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  dateDay: {
    fontFamily: fonts.frauncesBold,
    fontSize: 18,
    lineHeight: 20,
  },
  dateMonth: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  cardInfo:   { flex: 1, gap: 4 },
  tagBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  tagBadgeText: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontFamily: fonts.frauncesBold,
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  cardMeta: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    color: colors.textSecondary,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    flexShrink: 0,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  cardOrg: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    color: colors.textTertiary,
  },
  cardPrice: {
    fontFamily: fonts.frauncesBold,
    fontSize: 15,
    color: colors.accent,
  },
});