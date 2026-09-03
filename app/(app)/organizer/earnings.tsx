import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import Svg, { Rect, Line, Text as SvgText } from "react-native-svg";
import { colors, fonts, radius } from "@/src/theme";
import { useAuthStore } from "@/src/store/auth-store";
import React from "react";

const BASE_URL = "https://eventapp-ju5c.onrender.com";

type RevenuePoint = { date: string; amount: number };

type PerEventStat = {
  _id: string;
  title: string;
  date: string;
  venue?: string;
  category?: string;
  price: number;
  totalCapacity: number;
  ticketsSold: number;
  ticketsRemaining: number;
  estimatedGross: number;
  sellThroughRate: number | null;
  isFree: boolean;
  isPast: boolean;
};

type Analytics = {
  totalEvents: number;
  ticketsSold: number;
  totalRevenue: number;
  upcomingEvents: number;
  revenueOverTime: RevenuePoint[];
  perEventStats: PerEventStat[];
};

function formatNairaFull(amount: number) {
  return "₦" + amount.toLocaleString("en-NG");
}

function formatNairaShort(amount: number) {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(0)}k`;
  return `₦${amount}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
}

function RevenueBarChart({ data }: { data: RevenuePoint[] }) {
  const CHART_WIDTH = 320;
  const CHART_HEIGHT = 130;
  const PADDING_LEFT = 44;
  const PADDING_BOTTOM = 24;
  const PADDING_TOP = 16;

  const plotWidth = CHART_WIDTH - PADDING_LEFT - 8;
  const plotHeight = CHART_HEIGHT - PADDING_BOTTOM - PADDING_TOP;

  const maxAmount = Math.max(...data.map((d) => d.amount), 1);
  const barWidth = Math.max(6, (plotWidth / data.length) * 0.5);
  const barGap = plotWidth / data.length;

  const yLabels = [0, Math.round(maxAmount / 2), maxAmount];

  return (
    <Svg
      width="100%"
      height={CHART_HEIGHT}
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
    >
      {yLabels.map((val, i) => {
        const y = PADDING_TOP + plotHeight - (val / maxAmount) * plotHeight;
        return (
          <React.Fragment key={i}>
            <Line
              x1={PADDING_LEFT}
              y1={y}
              x2={CHART_WIDTH - 8}
              y2={y}
              stroke="#2A2A2A"
              strokeWidth="1"
              strokeDasharray={i === 0 ? "0" : "3,3"}
            />
            <SvgText
              x={PADDING_LEFT - 4}
              y={y + 4}
              fontSize="8"
              fill="#444"
              textAnchor="end"
            >
              {formatNairaShort(val)}
            </SvgText>
          </React.Fragment>
        );
      })}

      {data.map((point, i) => {
        const barHeight = Math.max(4, (point.amount / maxAmount) * plotHeight);
        const x = PADDING_LEFT + i * barGap + (barGap - barWidth) / 2;
        const y = PADDING_TOP + plotHeight - barHeight;

        return (
          <React.Fragment key={i}>
            {/* Track bar */}
            <Rect
              x={x}
              y={PADDING_TOP}
              width={barWidth}
              height={plotHeight}
              rx={4}
              fill="rgba(202,255,0,0.08)"
            />
            {/* Fill bar */}
            <Rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={4}
              fill={colors.accent}
            />
            <SvgText
              x={x + barWidth / 2}
              y={CHART_HEIGHT - 4}
              fontSize="7"
              fill="#444"
              textAnchor="middle"
            >
              {formatShortDate(point.date)}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

function SellThroughBar({ rate }: { rate: number }) {
  const barColor =
    rate >= 75 ? colors.accent : rate >= 40 ? "#F59E0B" : "#FF4D6D";
  return (
    <View style={barStyles.track}>
      <View
        style={[
          barStyles.fill,
          { width: `${rate}%` as any, backgroundColor: barColor },
        ]}
      />
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: {
    height: 4,
    backgroundColor: colors.surface2,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 6,
  },
  fill: {
    height: "100%",
    borderRadius: 2,
  },
});

export default function EarningsScreen() {
  const token = useAuthStore((s) => s.token);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showAllPaid, setShowAllPaid] = useState(false);
  const [showAllFree, setShowAllFree] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/organizers/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setAnalytics(data);
      else setError("Failed to load earnings data");
    } catch {
      setError("Failed to load earnings data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const perEventStats = analytics?.perEventStats ?? [];
  const paidEvents = perEventStats.filter((e) => !e.isFree);
  const freeEvents = perEventStats.filter((e) => e.isFree);
  const revenuePoints = (analytics?.revenueOverTime ?? []).filter(
    (p) => p.amount > 0
  );

  const totalCapacity = perEventStats.reduce(
    (sum, e) => sum + (e.totalCapacity || 0), 0
  );
  const totalSold = analytics?.ticketsSold ?? 0;
  const overallSellThrough =
    totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0;
  const totalRemaining = perEventStats.reduce(
    (sum, e) => sum + (e.ticketsRemaining || 0), 0
  );

  const visiblePaid = showAllPaid ? paidEvents : paidEvents.slice(0, 3);
  const visibleFree = showAllFree ? freeEvents : freeEvents.slice(0, 3);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
      </View>

      {/* Hero revenue card — acid green tint, consistent with dashboard */}
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>TOTAL REVENUE</Text>
        <Text style={styles.heroAmount}>
          {formatNairaFull(analytics?.totalRevenue ?? 0)}
        </Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{totalSold}</Text>
            <Text style={styles.heroStatLabel}>Tickets Sold</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>
              {analytics?.totalEvents ?? 0}
            </Text>
            <Text style={styles.heroStatLabel}>Total Events</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{overallSellThrough}%</Text>
            <Text style={styles.heroStatLabel}>Sell-through</Text>
          </View>
        </View>
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{analytics?.upcomingEvents ?? 0}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{paidEvents.length}</Text>
          <Text style={styles.statLabel}>Paid</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{freeEvents.length}</Text>
          <Text style={styles.statLabel}>Free</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalRemaining}</Text>
          <Text style={styles.statLabel}>Remaining</Text>
        </View>
      </View>

      {/* Ticket inventory */}
      {totalCapacity > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TICKET INVENTORY</Text>
          <View style={styles.inventoryCard}>
            <View style={styles.inventoryRow}>
              <View style={styles.inventoryItem}>
                <Text style={styles.inventoryValue}>{totalSold}</Text>
                <Text style={styles.inventoryLabel}>Sold</Text>
              </View>
              <View style={styles.inventoryDivider} />
              <View style={styles.inventoryItem}>
                <Text style={styles.inventoryValue}>{totalRemaining}</Text>
                <Text style={styles.inventoryLabel}>Remaining</Text>
              </View>
              <View style={styles.inventoryDivider} />
              <View style={styles.inventoryItem}>
                <Text style={styles.inventoryValue}>{totalCapacity}</Text>
                <Text style={styles.inventoryLabel}>Capacity</Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${overallSellThrough}%` as any },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {overallSellThrough}% sold through
            </Text>
          </View>
        </View>
      )}

      {/* Revenue chart */}
      {revenuePoints.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>REVENUE OVER TIME</Text>
          <View style={styles.chartCard}>
            <RevenueBarChart data={revenuePoints} />
          </View>
        </View>
      )}

      {/* Paid events */}
      {paidEvents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PAID EVENTS</Text>
          <View style={styles.eventList}>
            {visiblePaid.map((event, index) => (
              <View
                key={event._id}
                style={[
                  styles.eventRow,
                  index < visiblePaid.length - 1 && styles.eventRowBorder,
                ]}
              >
                <View style={styles.eventRowTopRow}>
                  <Text style={styles.eventRowTitle} numberOfLines={1}>
                    {event.title}
                  </Text>
                  <View style={[
                    styles.statusPill,
                    event.isPast ? styles.statusPillPast : styles.statusPillLive,
                  ]}>
                    <Text style={[
                      styles.statusPillText,
                      event.isPast ? styles.statusPillTextPast : styles.statusPillTextLive,
                    ]}>
                      {event.isPast ? "PAST" : "LIVE"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.eventRowDate}>{formatDate(event.date)}</Text>

                <View style={styles.eventStatsRow}>
                  <View style={styles.eventStat}>
                    <Text style={styles.eventStatValue}>{event.ticketsSold}</Text>
                    <Text style={styles.eventStatLabel}>Sold</Text>
                  </View>
                  <View style={styles.eventStatDivider} />
                  <View style={styles.eventStat}>
                    <Text style={styles.eventStatValue}>{event.ticketsRemaining}</Text>
                    <Text style={styles.eventStatLabel}>Remaining</Text>
                  </View>
                  <View style={styles.eventStatDivider} />
                  <View style={styles.eventStat}>
                    <Text style={styles.eventStatValue}>
                      {formatNairaFull(event.price)}
                    </Text>
                    <Text style={styles.eventStatLabel}>Per Ticket</Text>
                  </View>
                  <View style={styles.eventStatDivider} />
                  <View style={styles.eventStat}>
                    <Text style={[styles.eventStatValue, { color: colors.accent }]}>
                      {formatNairaShort(event.estimatedGross)}
                    </Text>
                    <Text style={styles.eventStatLabel}>Gross</Text>
                  </View>
                </View>

                {event.sellThroughRate !== null && (
                  <View style={styles.sellThroughRow}>
                    <SellThroughBar rate={event.sellThroughRate} />
                    <Text style={styles.sellThroughLabel}>
                      {event.sellThroughRate}% sold through
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {paidEvents.length > 3 && (
            <Pressable
              style={styles.showMoreBtn}
              onPress={() => setShowAllPaid((v) => !v)}
            >
              <Text style={styles.showMoreText}>
                {showAllPaid ? "Show less" : `Show all ${paidEvents.length} events`}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Free events */}
      {freeEvents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>FREE EVENTS</Text>
          <View style={styles.eventList}>
            {visibleFree.map((event, index) => (
              <View
                key={event._id}
                style={[
                  styles.eventRow,
                  index < visibleFree.length - 1 && styles.eventRowBorder,
                ]}
              >
                <View style={styles.eventRowTopRow}>
                  <Text style={styles.eventRowTitle} numberOfLines={1}>
                    {event.title}
                  </Text>
                  <View style={[
                    styles.statusPill,
                    event.isPast ? styles.statusPillPast : styles.statusPillLive,
                  ]}>
                    <Text style={[
                      styles.statusPillText,
                      event.isPast ? styles.statusPillTextPast : styles.statusPillTextLive,
                    ]}>
                      {event.isPast ? "PAST" : "LIVE"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.eventRowDate}>{formatDate(event.date)}</Text>
                <View style={styles.eventStatsRow}>
                  <View style={styles.eventStat}>
                    <Text style={styles.eventStatValue}>{event.ticketsRemaining}</Text>
                    <Text style={styles.eventStatLabel}>Remaining</Text>
                  </View>
                  <View style={styles.eventStatDivider} />
                  <View style={styles.eventStat}>
                    <Text style={styles.eventStatValue}>
                      {event.totalCapacity || "—"}
                    </Text>
                    <Text style={styles.eventStatLabel}>Capacity</Text>
                  </View>
                  <View style={styles.eventStatDivider} />
                  <View style={styles.eventStat}>
                    <Text style={styles.eventStatValue}>Free</Text>
                    <Text style={styles.eventStatLabel}>Price</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {freeEvents.length > 3 && (
            <Pressable
              style={styles.showMoreBtn}
              onPress={() => setShowAllFree((v) => !v)}
            >
              <Text style={styles.showMoreText}>
                {showAllFree ? "Show less" : `Show all ${freeEvents.length} events`}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {perEventStats.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>₦</Text>
          <Text style={styles.emptyTitle}>No earnings yet</Text>
          <Text style={styles.emptySub}>
            Create your first paid event to start tracking revenue here.
          </Text>
        </View>
      )}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pageBg },
  content:   { paddingHorizontal: 20 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    backgroundColor: colors.pageBg,
  },
  errorText: {
    fontFamily: fonts.dmSans,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
  },
  retryBtnText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 14,
    color: "#0A0A0A",
  },

  header: {
    paddingTop: 56,
    paddingBottom: 20,
  },
  headerTitle: {
    fontFamily: fonts.frauncesBlack,
    fontSize: 28,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },

  // Hero card — acid green tint, no gradient
  heroCard: {
    backgroundColor: "rgba(202,255,0,0.04)",
    borderWidth: 1,
    borderColor: "rgba(202,255,0,0.2)",
    borderRadius: radius.xxl,
    padding: 24,
    marginBottom: 16,
  },
  heroLabel: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  heroAmount: {
    fontFamily: fonts.frauncesBlack,
    fontSize: 42,
    color: colors.accent,
    letterSpacing: -1,
    marginBottom: 20,
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroStat: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  heroStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  heroStatValue: {
    fontFamily: fonts.frauncesBold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  heroStatLabel: {
    fontFamily: fonts.dmSans,
    fontSize: 11,
    color: colors.textSecondary,
  },

  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontFamily: fonts.frauncesBold,
    fontSize: 22,
    color: colors.textPrimary,
  },
  statLabel: {
    fontFamily: fonts.dmSans,
    fontSize: 10,
    color: colors.textTertiary,
    textAlign: "center",
  },

  section:      { marginBottom: 24 },
  sectionLabel: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  inventoryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  inventoryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  inventoryItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  inventoryDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  inventoryValue: {
    fontFamily: fonts.frauncesBold,
    fontSize: 22,
    color: colors.textPrimary,
  },
  inventoryLabel: {
    fontFamily: fonts.dmSans,
    fontSize: 10,
    color: colors.textTertiary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: "rgba(202,255,0,0.12)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  progressLabel: {
    fontFamily: fonts.dmSans,
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: "center",
  },

  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },

  eventList: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  eventRow: {
    padding: 16,
    gap: 6,
  },
  eventRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  eventRowTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  eventRowTitle: {
    fontFamily: fonts.dmSansBold,
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  eventRowDate: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    color: colors.textSecondary,
  },

  eventStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: 10,
  },
  eventStat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  eventStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  eventStatValue: {
    fontFamily: fonts.frauncesBold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  eventStatLabel: {
    fontFamily: fonts.dmSans,
    fontSize: 9,
    color: colors.textTertiary,
  },

  sellThroughRow: {
    marginTop: 2,
    gap: 4,
  },
  sellThroughLabel: {
    fontFamily: fonts.dmSans,
    fontSize: 10,
    color: colors.textTertiary,
  },

  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillLive: {
    backgroundColor: "rgba(202,255,0,0.1)",
    borderWidth: 1,
    borderColor: "rgba(202,255,0,0.25)",
  },
  statusPillPast: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusPillText: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  statusPillTextLive: { color: colors.accent },
  statusPillTextPast: { color: colors.textTertiary },

  showMoreBtn: {
    marginTop: 10,
    alignItems: "center",
    paddingVertical: 10,
  },
  showMoreText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 13,
    color: colors.accent,
  },

  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
    color: colors.textTertiary,
  },
  emptyTitle: {
    fontFamily: fonts.frauncesBold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  emptySub: {
    fontFamily: fonts.dmSans,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 260,
  },
});