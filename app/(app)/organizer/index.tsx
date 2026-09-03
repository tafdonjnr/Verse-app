import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts, radius, getCategoryTheme } from "@/src/theme";
import { useAuthStore } from "@/src/store/auth-store";

const BASE_URL = "https://eventapp-ju5c.onrender.com";

type Analytics = {
  totalEvents: number;
  ticketsSold: number;
  totalRevenue: number;
  upcomingEvents: number;
  revenueOverTime: { date: string; amount: number }[];
};

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

type OrganizerInfo = {
  name: string;
  orgName: string;
  email: string;
  logo?: string;
  bio?: string;
};

// ─── Onboarding empty state ───────────────────────────────────────────────────

function OrganizerOnboarding({ organizer }: { organizer: OrganizerInfo }) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.onboardingScroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome to Verse</Text>
          <Text style={styles.orgName}>{organizer.orgName}</Text>
        </View>
        <Pressable
          style={styles.avatar}
          onPress={() => router.push("/organizer/profile" as any)}
        >
          {organizer.logo ? (
            <Image source={{ uri: organizer.logo }} style={styles.avatarImg} />
          ) : (
            <LinearGradient
              colors={["#7B7BD6", "#4A4A9C"]}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>
                {organizer.orgName?.[0]?.toUpperCase() ?? "O"}
              </Text>
            </LinearGradient>
          )}
        </Pressable>
      </View>

      {/* Onboarding card */}
      <View style={styles.onboardingCard}>
        <View style={styles.onboardingTop}>
          <Text style={styles.onboardingTitle}>
            Set up your organizer profile
          </Text>
          <Text style={styles.onboardingSub}>
            Attendees trust verified organizers. Complete your profile before
            creating your first event.
          </Text>
        </View>

        <View style={styles.trustList}>
          <View style={styles.trustItem}>
            <View style={[styles.trustIcon, { backgroundColor: "rgba(202,255,0,0.1)" }]}>
              <Text style={styles.trustIconText}>🖼</Text>
            </View>
            <View style={styles.trustText}>
              <Text style={styles.trustTitle}>Organization logo</Text>
              <Text style={styles.trustSub}>
                Shown on every ticket and event listing
              </Text>
            </View>
            <View style={[styles.trustStatus, { backgroundColor: colors.surface2 }]}>
              <Text style={styles.trustStatusText}>
                {organizer.logo ? "✓" : "—"}
              </Text>
            </View>
          </View>

          <View style={styles.trustDivider} />

          <View style={styles.trustItem}>
            <View style={[styles.trustIcon, { backgroundColor: "rgba(202,255,0,0.1)" }]}>
              <Text style={styles.trustIconText}>📝</Text>
            </View>
            <View style={styles.trustText}>
              <Text style={styles.trustTitle}>Bio</Text>
              <Text style={styles.trustSub}>
                Tell attendees who you are and what you do
              </Text>
            </View>
            <View style={[styles.trustStatus, { backgroundColor: colors.surface2 }]}>
              <Text style={styles.trustStatusText}>
                {organizer.bio ? "✓" : "—"}
              </Text>
            </View>
          </View>

          <View style={styles.trustDivider} />

          <View style={styles.trustItem}>
            <View style={[styles.trustIcon, { backgroundColor: "rgba(202,255,0,0.1)" }]}>
              <Text style={styles.trustIconText}>🔗</Text>
            </View>
            <View style={styles.trustText}>
              <Text style={styles.trustTitle}>Social handles</Text>
              <Text style={styles.trustSub}>
                Instagram, Twitter, or website link
              </Text>
            </View>
            <View style={[styles.trustStatus, { backgroundColor: colors.surface2 }]}>
              <Text style={styles.trustStatusText}>—</Text>
            </View>
          </View>
        </View>

        <Pressable
          style={styles.onboardingBtn}
          onPress={() => router.push("/organizer/profile" as any)}
        >
          <Text style={styles.onboardingBtnText}>Complete Profile →</Text>
        </Pressable>
      </View>

      {/* Skip — lets them go to dashboard anyway */}
      <Pressable
        style={styles.skipBtn}
        onPress={() => router.push("/organizer/create-event" as any)}
      >
        <Text style={styles.skipBtnText}>Skip for now — Create an event</Text>
      </Pressable>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function OrganizerDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [organizer, setOrganizer] = useState<OrganizerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const token = useAuthStore((s) => s.token);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [dashRes, analyticsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/organizers/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/api/organizers/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const dashData = await dashRes.json();
      const analyticsData = await analyticsRes.json();
      setOrganizer(dashData.organizer);
      setEvents(dashData.events ?? []);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const formatRevenue = (amount: number) =>
    `₦${Number(amount).toLocaleString()}`;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const liveEvents = events.filter((e) => new Date(e.date) > new Date());

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  // Show onboarding if profile is incomplete
  const profileIncomplete = organizer && !organizer.bio && !organizer.logo;
  if (profileIncomplete) {
    return <OrganizerOnboarding organizer={organizer} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchData(true)}
          tintColor={colors.accent}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {getGreeting()}, {organizer?.name?.split(" ")[0] ?? ""}
          </Text>
          <Text style={styles.orgName}>
            {organizer?.orgName ?? "Your Dashboard"}
          </Text>
        </View>
        <Pressable
          style={styles.avatar}
          onPress={() => router.push("/organizer/profile" as any)}
        >
          {organizer?.logo ? (
            <Image source={{ uri: organizer.logo }} style={styles.avatarImg} />
          ) : (
            <LinearGradient
              colors={["#7B7BD6", "#4A4A9C"]}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>
                {organizer?.orgName?.[0]?.toUpperCase() ?? "O"}
              </Text>
            </LinearGradient>
          )}
        </Pressable>
      </View>

      {/* Stat cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.statCardPrimary]}>
          <Text style={styles.statCardLabel}>NET REVENUE</Text>
          <Text style={styles.statCardValueLarge}>
            {formatRevenue(analytics?.totalRevenue ?? 0)}
          </Text>
          <Text style={styles.statCardSub}>
            {analytics?.ticketsSold ?? 0} tickets sold
          </Text>
        </View>

        <View style={styles.statRow}>
          <View style={[styles.statCard, styles.statCardHalf]}>
            <Text style={styles.statCardLabel}>EVENTS</Text>
            <Text style={styles.statCardValue}>
              {analytics?.totalEvents ?? 0}
            </Text>
            <Text style={styles.statCardSub}>total</Text>
          </View>
          <View style={[styles.statCard, styles.statCardHalf]}>
            <Text style={styles.statCardLabel}>UPCOMING</Text>
            <Text style={styles.statCardValue}>
              {analytics?.upcomingEvents ?? 0}
            </Text>
            <Text style={styles.statCardSub}>events</Text>
          </View>
        </View>
      </View>

      {/* Payout skeleton card */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PAYOUTS</Text>
        <View style={styles.payoutCard}>
          <View style={styles.payoutCardTop}>
            <View style={styles.payoutCardLeft}>
              <Text style={styles.payoutCardTitle}>Available Balance</Text>
              <Text style={styles.payoutCardAmount}>—</Text>
              <Text style={styles.payoutCardSub}>
                Payouts activate after your first event
              </Text>
            </View>
            <Pressable style={styles.payoutBtn} disabled>
              <Text style={styles.payoutBtnText}>Withdraw</Text>
            </Pressable>
          </View>
          <View style={styles.payoutDivider} />
          <View style={styles.payoutMeta}>
            <Text style={styles.payoutMetaText}>
              🔒  Bank account not connected
            </Text>
            <Text style={styles.payoutMetaLink}>Set up →</Text>
          </View>
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <View style={styles.actionsGrid}>
          <Pressable
            style={styles.actionBtn}
            onPress={() => router.push("/organizer/create-event" as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: "rgba(202,255,0,0.1)" }]}>
              <Text style={[styles.actionIconText, { color: colors.accent }]}>+</Text>
            </View>
            <Text style={styles.actionLabel}>Create{"\n"}Event</Text>
          </Pressable>

          <Pressable
            style={styles.actionBtn}
            onPress={() => router.push("/organizer/events" as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.surface2 }]}>
              <Text style={styles.actionIconText}>📅</Text>
            </View>
            <Text style={styles.actionLabel}>My{"\n"}Events</Text>
          </Pressable>

          <Pressable
            style={styles.actionBtn}
            onPress={() => router.push("/organizer/scanner" as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.surface2 }]}>
              <Text style={styles.actionIconText}>⬛</Text>
            </View>
            <Text style={styles.actionLabel}>Gate{"\n"}Scanner</Text>
          </Pressable>

          <Pressable
            style={styles.actionBtn}
            onPress={() => router.push("/organizer/earnings" as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.surface2 }]}>
              <Text style={[styles.actionIconText, { color: colors.accent }]}>₦</Text>
            </View>
            <Text style={styles.actionLabel}>Earnings</Text>
          </Pressable>
        </View>
      </View>

      {/* Upcoming events */}
      {liveEvents.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>UPCOMING EVENTS</Text>
            {liveEvents.length > 3 && (
              <Pressable onPress={() => router.push("/organizer/events" as any)}>
                <Text style={styles.seeAllText}>See all →</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.eventsList}>
            {liveEvents.slice(0, 3).map((event) => {
              const theme = getCategoryTheme(event.category);
              const sold = event.ticketsSold ?? 0;
              const capacity = event.totalCapacity ?? 0;
              const sellThrough = capacity > 0
                ? Math.round((sold / capacity) * 100)
                : null;

              return (
                <Pressable
                  key={event._id}
                  style={styles.eventCard}
                  onPress={() =>
                    router.push(`/organizer/event/${event._id}` as any)
                  }
                >
                  <View style={[styles.eventCardStrip, { backgroundColor: theme.bg }]} />
                  <View style={styles.eventCardBody}>
                    <View style={styles.eventCardInfo}>
                      <Text style={styles.eventCardTitle} numberOfLines={1}>
                        {event.title}
                      </Text>
                      <Text style={styles.eventCardMeta}>
                        {formatDate(event.date)}
                        {event.venue ? `  ·  ${event.venue}` : ""}
                      </Text>
                      {sellThrough !== null && (
                        <View style={styles.sellThroughWrap}>
                          <View style={styles.sellThroughTrack}>
                            <View
                              style={[
                                styles.sellThroughFill,
                                {
                                  width: `${sellThrough}%` as any,
                                  backgroundColor: theme.bg,
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.sellThroughLabel}>
                            {sold}/{capacity} sold
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.eventCardRight}>
                      <Text style={styles.eventCardTickets}>
                        {event.ticketsAvailable ?? 0}
                      </Text>
                      <Text style={styles.eventCardTicketsLabel}>left</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Empty state — has events but none upcoming */}
      {events.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No events yet</Text>
          <Text style={styles.emptySub}>
            Create your first event to start selling tickets
          </Text>
          <Pressable
            style={styles.createBtn}
            onPress={() => router.push("/organizer/create-event" as any)}
          >
            <Text style={styles.createBtnText}>Create Event</Text>
          </Pressable>
        </View>
      )}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pageBg },
  center:    { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.pageBg },
  scroll:    { paddingBottom: 40 },

  // ── Onboarding ──
  onboardingScroll: { paddingBottom: 40 },
  onboardingCard: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  onboardingTop: {
    padding: 24,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  onboardingTitle: {
    fontFamily: fonts.frauncesBold,
    fontSize: 20,
    color: colors.textPrimary,
    lineHeight: 26,
  },
  onboardingSub: {
    fontFamily: fonts.dmSans,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  trustList: { paddingHorizontal: 20, paddingVertical: 8 },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  trustDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  trustIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  trustIconText: { fontSize: 18 },
  trustText: { flex: 1, gap: 2 },
  trustTitle: {
    fontFamily: fonts.dmSansSemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  trustSub: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    color: colors.textSecondary,
  },
  trustStatus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  trustStatusText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 13,
    color: colors.textTertiary,
  },
  onboardingBtn: {
    margin: 20,
    marginTop: 4,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: "center",
  },
  onboardingBtnText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 15,
    color: "#0A0A0A",
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 16,
  },
  skipBtnText: {
    fontFamily: fonts.dmSans,
    fontSize: 13,
    color: colors.textTertiary,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 20,
  },
  greeting: {
    fontFamily: fonts.dmSans,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  orgName: {
    fontFamily: fonts.frauncesBlack,
    fontSize: 24,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "hidden",
  },
  avatarImg: { width: 42, height: 42 },
  avatarGradient: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: fonts.frauncesBold,
    fontSize: 18,
    color: "#fff",
  },

  statsGrid: {
    paddingHorizontal: 20,
    marginBottom: 28,
    gap: 10,
  },
  statRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 4,
  },
  statCardPrimary: {
    borderColor: "rgba(202,255,0,0.2)",
    backgroundColor: "rgba(202,255,0,0.04)",
  },
  statCardHalf: { flex: 1 },
  statCardLabel: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: 1.5,
  },
  statCardValueLarge: {
    fontFamily: fonts.frauncesBlack,
    fontSize: 32,
    color: colors.accent,
    letterSpacing: -1,
    lineHeight: 38,
  },
  statCardValue: {
    fontFamily: fonts.frauncesBlack,
    fontSize: 28,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  statCardSub: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    color: colors.textSecondary,
  },

  section:      { paddingHorizontal: 20, marginBottom: 28 },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionLabel: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  seeAllText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 12,
    color: colors.accent,
    marginBottom: 12,
  },

  payoutCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  payoutCardTop: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 16,
  },
  payoutCardLeft: { flex: 1, gap: 3 },
  payoutCardTitle: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 1.2,
  },
  payoutCardAmount: {
    fontFamily: fonts.frauncesBlack,
    fontSize: 28,
    color: colors.textSecondary,
    letterSpacing: -0.5,
  },
  payoutCardSub: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    color: colors.textTertiary,
  },
  payoutBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    opacity: 0.5,
  },
  payoutBtnText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 13,
    color: colors.textSecondary,
  },
  payoutDivider: { height: 1, backgroundColor: colors.border },
  payoutMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  payoutMetaText: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    color: colors.textTertiary,
  },
  payoutMetaLink: {
    fontFamily: fonts.dmSansBold,
    fontSize: 12,
    color: colors.textTertiary,
    opacity: 0.5,
  },

  actionsGrid: { flexDirection: "row", gap: 12 },
  actionBtn:   { flex: 1, alignItems: "center", gap: 8 },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIconText: { fontSize: 20, color: colors.textPrimary },
  actionLabel: {
    fontFamily: fonts.dmSansMedium,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: "center",
  },

  eventsList: { gap: 10 },
  eventCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  eventCardStrip: { height: 3 },
  eventCardBody: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  eventCardInfo:  { flex: 1, gap: 4 },
  eventCardTitle: {
    fontFamily: fonts.frauncesBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  eventCardMeta: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    color: colors.textSecondary,
  },
  sellThroughWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  sellThroughTrack: {
    flex: 1,
    height: 3,
    backgroundColor: colors.surface2,
    borderRadius: 2,
    overflow: "hidden",
  },
  sellThroughFill: { height: 3, borderRadius: 2 },
  sellThroughLabel: {
    fontFamily: fonts.dmMono,
    fontSize: 10,
    color: colors.textTertiary,
  },
  eventCardRight: { alignItems: "center", gap: 2 },
  eventCardTickets: {
    fontFamily: fonts.frauncesBlack,
    fontSize: 20,
    color: colors.textPrimary,
  },
  eventCardTicketsLabel: {
    fontFamily: fonts.dmSans,
    fontSize: 11,
    color: colors.textTertiary,
  },

  emptyState: {
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 20,
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
  },
  createBtn: {
    marginTop: 12,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  createBtnText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 14,
    color: "#0A0A0A",
  },
});