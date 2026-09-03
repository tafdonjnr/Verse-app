import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { colors, fonts, radius, getCategoryTheme } from "@/src/theme";
import { useAuthStore } from "@/src/store/auth-store";

const BASE_URL = "https://eventapp-ju5c.onrender.com";

type Event = {
  _id: string;
  title: string;
  date: string;
  venue?: string;
  price?: number;
  ticketsAvailable?: number;
  totalCapacity?: number;
  ticketsSold?: number;
  category?: string;
  banner?: string;
};

type Tab = "all" | "upcoming" | "past";

export default function OrganizerEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const token = useAuthStore((s) => s.token);

  const fetchEvents = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    fetch(`${BASE_URL}/api/organizers/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setEvents(data.events ?? []))
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => { fetchEvents(); }, []);

  const now = new Date();

  const filtered = events.filter((e) => {
    const isPast = new Date(e.date) < now;
    if (activeTab === "upcoming") return !isPast;
    if (activeTab === "past") return isPast;
    return true;
  });

  const upcomingCount = events.filter((e) => new Date(e.date) >= now).length;
  const pastCount = events.filter((e) => new Date(e.date) < now).length;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatPrice = (price: any) =>
    price === undefined || price === null || price === 0
      ? "Free"
      : `₦${Number(price).toLocaleString()}`;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All", count: events.length },
    { key: "upcoming", label: "Upcoming", count: upcomingCount },
    { key: "past", label: "Past", count: pastCount },
  ];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Events</Text>
        <Pressable
          style={styles.createBtn}
          onPress={() => router.push("/organizer/create-event" as any)}
        >
          <Text style={styles.createBtnText}>+ New</Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.key && styles.tabTextActive,
            ]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[
                styles.tabBadge,
                activeTab === tab.key && styles.tabBadgeActive,
              ]}>
                <Text style={[
                  styles.tabBadgeText,
                  activeTab === tab.key && styles.tabBadgeTextActive,
                ]}>
                  {tab.count}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchEvents(true)}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No events found</Text>
            <Text style={styles.emptySub}>
              {activeTab === "upcoming"
                ? "No upcoming events scheduled"
                : activeTab === "past"
                ? "No past events yet"
                : "Create your first event to start selling"}
            </Text>
            {activeTab !== "past" && (
              <Pressable
                style={styles.emptyBtn}
                onPress={() => router.push("/organizer/create-event" as any)}
              >
                <Text style={styles.emptyBtnText}>Create Event</Text>
              </Pressable>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const theme = getCategoryTheme(item.category);
          const isPast = new Date(item.date) < now;
          const sold = item.ticketsSold ?? 0;
          const capacity = item.totalCapacity ?? 0;
          const remaining = item.ticketsAvailable ?? 0;
          const sellThrough = capacity > 0
            ? Math.round((sold / capacity) * 100)
            : null;

          return (
            <Pressable
              style={[styles.card, isPast && styles.cardPast]}
              onPress={() =>
                router.push(`/organizer/event/${item._id}` as any)
              }
            >
              <View style={[styles.cardStrip, { backgroundColor: theme.bg }]} />

              <View style={styles.cardBody}>
                {/* Top row */}
                <View style={styles.cardTop}>
                  <View style={styles.cardInfo}>
                    <View style={[styles.catBadge, { backgroundColor: theme.bg + "22" }]}>
                      <Text style={[styles.catBadgeText, { color: theme.bg }]}>
                        {item.category?.toUpperCase() ?? "GENERAL"}
                      </Text>
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.cardMeta}>
                      {formatDate(item.date)}
                      {item.venue ? `  ·  ${item.venue}` : ""}
                    </Text>
                  </View>

                  <View style={[
                    styles.statusBadge,
                    isPast ? styles.statusBadgePast : styles.statusBadgeLive,
                  ]}>
                    <Text style={[
                      styles.statusText,
                      isPast ? styles.statusTextPast : styles.statusTextLive,
                    ]}>
                      {isPast ? "PAST" : "UPCOMING"}
                    </Text>
                  </View>
                </View>

                {/* Sell-through bar */}
                {sellThrough !== null && (
                  <View style={styles.sellThroughWrap}>
                    <View style={styles.sellThroughTrack}>
                      <View style={[
                        styles.sellThroughFill,
                        {
                          width: `${sellThrough}%` as any,
                          backgroundColor: theme.bg,
                        },
                      ]} />
                    </View>
                    <Text style={styles.sellThroughLabel}>
                      {sold}/{capacity} sold
                    </Text>
                  </View>
                )}

                {/* Stats row */}
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{remaining}</Text>
                    <Text style={styles.statLabel}>Remaining</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{sold}</Text>
                    <Text style={styles.statLabel}>Sold</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{formatPrice(item.price)}</Text>
                    <Text style={styles.statLabel}>Price</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pageBg },
  center:    { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.pageBg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontFamily: fonts.frauncesBlack,
    fontSize: 28,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  createBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.lg,
  },
  createBtnText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 13,
    color: "#0A0A0A",
  },

  tabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tabText: {
    fontFamily: fonts.dmSansMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  tabTextActive: { color: "#0A0A0A" },
  tabBadge: {
    backgroundColor: colors.surface2,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabBadgeActive: {
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  tabBadgeText: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 10,
    color: colors.textSecondary,
  },
  tabBadgeTextActive: {
    color: "#0A0A0A",
  },

  list: { padding: 20, gap: 12, paddingBottom: 120 },

  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fonts.frauncesBold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  emptySub: {
    fontFamily: fonts.dmSans,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  emptyBtn: {
    marginTop: 12,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyBtnText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 14,
    color: "#0A0A0A",
  },

  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  cardPast:  { opacity: 0.5 },
  cardStrip: { height: 3 },
  cardBody:  { padding: 14 },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  cardInfo: { flex: 1, gap: 4 },
  catBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  catBadgeText: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontFamily: fonts.frauncesBold,
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  cardMeta: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    color: colors.textSecondary,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  statusBadgeLive: {
    backgroundColor: "rgba(202,255,0,0.1)",
    borderWidth: 1,
    borderColor: "rgba(202,255,0,0.25)",
  },
  statusBadgePast: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusText: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 9,
    letterSpacing: 1,
  },
  statusTextLive: { color: colors.accent },
  statusTextPast: { color: colors.textTertiary },

  sellThroughWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sellThroughTrack: {
    flex: 1,
    height: 3,
    backgroundColor: colors.surface2,
    borderRadius: 2,
    overflow: "hidden",
  },
  sellThroughFill: {
    height: 3,
    borderRadius: 2,
  },
  sellThroughLabel: {
    fontFamily: fonts.dmMono,
    fontSize: 10,
    color: colors.textTertiary,
  },

  statsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  stat:         { flex: 1, alignItems: "center", gap: 3 },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  statValue: {
    fontFamily: fonts.frauncesBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  statLabel: {
    fontFamily: fonts.dmSans,
    fontSize: 11,
    color: colors.textTertiary,
  },
});