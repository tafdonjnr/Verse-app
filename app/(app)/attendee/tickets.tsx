import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { colors, fonts, radius } from "@/src/theme";
import { useAuthStore } from "@/src/store/auth-store";
import { resolveOrganizerLogo } from "@/src/utils/media";

const BASE_URL = "https://eventapp-ju5c.onrender.com";

type Ticket = {
  ticketId: string;
  eventTitle: string;
  eventDate: string;
  eventLocation?: string;
  organizerName?: string | null;
  organizerLogo?: string | null;
  amount?: number;
  currency?: string;
  status: string;
  qrCodePath?: string;
  createdAt: string;
};

export default function MyTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  const token = useAuthStore((s) => s.token);

  const fetchTickets = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    fetch(`${BASE_URL}/api/tickets/my-tickets`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setTickets(data.tickets ?? []))
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const now = new Date();
  const upcoming = tickets.filter(
    (t) => new Date(t.eventDate) >= now && t.status !== "used"
  );
  const past = tickets.filter(
    (t) => new Date(t.eventDate) < now || t.status === "used"
  );
  const displayed = activeTab === "upcoming" ? upcoming : past;

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatAmount = (amount: any) =>
    amount ? `₦${Number(amount / 100).toLocaleString()}` : "Free";

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
        <Text style={styles.headerTitle}>My Tickets</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === "upcoming" && styles.tabActive]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text style={[styles.tabText, activeTab === "upcoming" && styles.tabTextActive]}>
            Upcoming
          </Text>
          {upcoming.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{upcoming.length}</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          style={[styles.tab, activeTab === "past" && styles.tabActive]}
          onPress={() => setActiveTab("past")}
        >
          <Text style={[styles.tabText, activeTab === "past" && styles.tabTextActive]}>
            Past
          </Text>
          {past.length > 0 && (
            <View style={[styles.tabBadge, styles.tabBadgeMuted]}>
              <Text style={[styles.tabBadgeText, styles.tabBadgeTextMuted]}>
                {past.length}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      <FlatList
        data={displayed}
        keyExtractor={(item) => item.ticketId}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchTickets(true)}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {activeTab === "upcoming" ? "No upcoming tickets" : "No past tickets"}
            </Text>
            <Text style={styles.emptySub}>
              {activeTab === "upcoming"
                ? "Browse events and grab your tickets"
                : "Events you've attended will appear here"}
            </Text>
            {activeTab === "upcoming" && (
              <Pressable
                style={styles.browseBtn}
                onPress={() => router.replace("/attendee" as any)}
              >
                <Text style={styles.browseBtnText}>Browse Events</Text>
              </Pressable>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, item.status === "used" && styles.cardUsed]}
            onPress={() =>
              router.push(`/attendee/e-ticket?ticketId=${item.ticketId}` as any)
            }
          >
            {/* Date block */}
            <View style={styles.dateBlock}>
              <Text style={styles.dateDay}>
                {new Date(item.eventDate).getDate()}
              </Text>
              <Text style={styles.dateMonth}>
                {new Date(item.eventDate).toLocaleString("en-NG", { month: "short" })}
              </Text>
            </View>

            {/* Divider */}
            <View style={styles.cardDivider} />

            {/* Info */}
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.eventTitle}
              </Text>
              {(item.organizerName || item.organizerLogo) ? (
                <View style={styles.organizerRow}>
                  {resolveOrganizerLogo(item.organizerLogo) ? (
                    <Image
                      source={{ uri: resolveOrganizerLogo(item.organizerLogo)! }}
                      style={styles.organizerLogo}
                    />
                  ) : (
                    <View style={styles.organizerLogoFallback}>
                      <Text style={styles.organizerLogoFallbackText}>
                        {item.organizerName?.[0]?.toUpperCase() ?? "O"}
                      </Text>
                    </View>
                  )}
                  {item.organizerName ? (
                    <Text style={styles.organizerName} numberOfLines={1}>
                      {item.organizerName}
                    </Text>
                  ) : null}
                </View>
              ) : null}
              <Text style={styles.cardMeta}>
                {formatTime(item.eventDate)}
                {item.eventLocation ? `  ·  ${item.eventLocation}` : ""}
              </Text>
              <Text style={styles.cardAmount}>
                {formatAmount(item.amount)}
              </Text>
            </View>

            {/* Status + arrow */}
            <View style={styles.cardRight}>
              <View style={[
                styles.statusBadge,
                item.status === "used" && styles.statusBadgeUsed,
              ]}>
                <Text style={[
                  styles.statusText,
                  item.status === "used" && styles.statusTextUsed,
                ]}>
                  {item.status === "used" ? "USED" : "VALID"}
                </Text>
              </View>
              <Text style={styles.cardArrow}>›</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pageBg },
  center:    { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.pageBg },

  header: {
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
    paddingHorizontal: 16,
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
  tabTextActive: {
    color: "#0A0A0A",
  },
  tabBadge: {
    backgroundColor: "rgba(202,255,0,0.15)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabBadgeText: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 10,
    color: colors.accent,
  },
  tabBadgeMuted: {
    backgroundColor: colors.surface2,
  },
  tabBadgeTextMuted: {
    color: colors.textSecondary,
  },

  list:  { padding: 20, gap: 12, paddingBottom: 120 },

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
    paddingHorizontal: 40,
  },
  browseBtn: {
    marginTop: 16,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  browseBtnText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 14,
    color: "#0A0A0A",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  cardUsed: {
    opacity: 0.4,
  },

  dateBlock: {
    width: 60,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(202,255,0,0.08)",
    gap: 2,
  },
  dateDay: {
    fontFamily: fonts.frauncesBlack,
    fontSize: 22,
    color: colors.accent,
    lineHeight: 24,
  },
  dateMonth: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 10,
    color: colors.accent,
    letterSpacing: 0.5,
  },

  cardDivider: {
    width: 1,
    height: "60%",
    backgroundColor: colors.border,
  },

  cardInfo: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 3,
  },
  cardTitle: {
    fontFamily: fonts.frauncesBold,
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  organizerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  organizerLogo: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  organizerLogoFallback: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  organizerLogoFallbackText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 9,
    color: colors.textSecondary,
  },
  organizerName: {
    fontFamily: fonts.dmSansMedium,
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },
  cardMeta: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardAmount: {
    fontFamily: fonts.dmSansBold,
    fontSize: 13,
    color: colors.accent,
    marginTop: 2,
  },

  cardRight: {
    paddingRight: 14,
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    backgroundColor: "rgba(202,255,0,0.1)",
    borderWidth: 1,
    borderColor: "rgba(202,255,0,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeUsed: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
  },
  statusText: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 9,
    color: colors.accent,
    letterSpacing: 1,
  },
  statusTextUsed: {
    color: colors.textTertiary,
  },
  cardArrow: {
    fontSize: 20,
    color: colors.textTertiary,
  },
});