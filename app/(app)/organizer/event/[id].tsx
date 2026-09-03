import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts, radius, getCategoryTheme } from "@/src/theme";
import { useAuthStore } from "@/src/store/auth-store";

const BASE_URL = "https://eventapp-ju5c.onrender.com";

type Event = {
  _id: string;
  title: string;
  description?: string;
  date: string;
  venue?: string;
  price?: number;
  ticketsAvailable?: number;
  totalCapacity?: number;
  ticketsSold?: number;
  category?: string;
  banner?: string;
  organizer?: { orgName?: string };
};

export default function OrganizerEventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    fetch(`${BASE_URL}/api/events/${id}`)
      .then((r) => r.json())
      .then(setEvent)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatPrice = (price: any) =>
    price === undefined || price === null || price === 0
      ? "Free"
      : `₦${Number(price).toLocaleString()}`;

  const handleDelete = () => {
    Alert.alert(
      "Delete Event",
      "Are you sure you want to delete this event? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              const res = await fetch(`${BASE_URL}/api/events/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              if (res.ok) {
                router.replace("/organizer/events" as any);
              } else {
                const data = await res.json();
                Alert.alert("Error", data.message ?? "Failed to delete event");
              }
            } catch {
              Alert.alert("Error", "Something went wrong");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Event",
      "This will cancel the event and automatically refund all ticket buyers. This cannot be undone.",
      [
        { text: "Go Back", style: "cancel" },
        {
          text: "Cancel Event & Refund All",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${BASE_URL}/api/events/${id}/cancel`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
              });
              const data = await res.json();
              if (res.ok) {
                Alert.alert(
                  "Event Cancelled",
                  `Refunds triggered for ${data.refundsTriggered} ticket(s). Attendees will receive their money within 5–10 business days.`,
                  [{ text: "OK", onPress: () => router.replace("/organizer/events") }]
                );
              } else {
                Alert.alert("Error", data.message ?? "Failed to cancel event");
              }
            } catch {
              Alert.alert("Error", "Network error — try again");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Event not found</Text>
      </View>
    );
  }

  const theme = getCategoryTheme(event.category);
  const isPast = new Date(event.date) < new Date();
  const sold = event.ticketsSold ?? 0;
  const capacity = event.totalCapacity ?? 0;
  const remaining = event.ticketsAvailable ?? 0;
  const sellThrough = capacity > 0 ? Math.round((sold / capacity) * 100) : null;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Hero */}
        <View style={styles.heroWrap}>
          {event.banner ? (
            <Image
              source={{ uri: event.banner }}
              style={styles.hero}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.hero, { backgroundColor: theme.bg + "33" }]} />
          )}

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.75)"]}
            style={styles.heroGradient}
          />

          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backArrow}>←</Text>
          </Pressable>

          <View style={[styles.categoryPill, { backgroundColor: theme.bg }]}>
            <Text style={styles.categoryPillText}>
              {event.category?.toUpperCase() ?? "GENERAL"}
            </Text>
          </View>

          <View style={[
            styles.statusPill,
            isPast ? styles.statusPillPast : styles.statusPillLive,
          ]}>
            <Text style={[
              styles.statusPillText,
              isPast ? styles.statusPillTextPast : styles.statusPillTextLive,
            ]}>
              {isPast ? "PAST" : "UPCOMING"}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{event.title}</Text>

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>DATE</Text>
              <Text style={styles.statValue}>
                {new Date(event.date).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </View>
            <View style={[styles.statBox, styles.statBoxBorder]}>
              <Text style={styles.statLabel}>TIME</Text>
              <Text style={styles.statValue}>{formatTime(event.date)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>PRICE</Text>
              <Text style={[styles.statValue, { color: colors.accent }]}>
                {formatPrice(event.price)}
              </Text>
            </View>
          </View>

          {/* Tickets card */}
          <View style={styles.ticketsCard}>
            <View style={styles.ticketsRow}>
              <View style={styles.ticketsStat}>
                <Text style={styles.ticketsLabel}>REMAINING</Text>
                <Text style={styles.ticketsValue}>{remaining}</Text>
              </View>
              <View style={styles.ticketsStatDivider} />
              <View style={styles.ticketsStat}>
                <Text style={styles.ticketsLabel}>SOLD</Text>
                <Text style={[styles.ticketsValue, { color: colors.accent }]}>
                  {sold}
                </Text>
              </View>
              <View style={styles.ticketsStatDivider} />
              <View style={styles.ticketsStat}>
                <Text style={styles.ticketsLabel}>CAPACITY</Text>
                <Text style={styles.ticketsValue}>{capacity || "—"}</Text>
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
                <Text style={styles.sellThroughLabel}>{sellThrough}% sold</Text>
              </View>
            )}

            <Pressable
              style={styles.scanBtn}
              onPress={() => router.push("/organizer/scanner" as any)}
            >
              <Text style={styles.scanBtnText}>⬛  Open Gate Scanner</Text>
            </Pressable>
          </View>

          {/* Venue */}
          {event.venue ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📍</Text>
              <Text style={styles.infoText}>{event.venue}</Text>
            </View>
          ) : null}

          {/* Description */}
          {event.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ABOUT</Text>
              <Text style={styles.description}>{event.description}</Text>
            </View>
          ) : null}

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={styles.editBtn}
              onPress={() =>
                router.push({
                  pathname: "/organizer/create-event" as any,
                  params: { id: event._id, edit: "true" },
                })
              }
            >
              <Text style={styles.editBtnText}>Edit Event</Text>
            </Pressable>

            <Pressable
              style={styles.cancelEventBtn}
              onPress={handleCancel}
            >
              <Text style={styles.cancelEventBtnText}>
                Cancel Event & Refund Attendees
              </Text>
            </Pressable>

            <Pressable
              style={styles.deleteBtn}
              onPress={handleDelete}
              disabled={deleting}
            >
              <Text style={styles.deleteBtnText}>
                {deleting ? "Deleting..." : "Delete Event"}
              </Text>
            </Pressable>
          </View>

          <View style={{ height: 60 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pageBg },
  center:    { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.pageBg },
  errorText: { fontFamily: fonts.dmSans, color: colors.textSecondary },
  scroll:    { paddingBottom: 0 },

  heroWrap:     { position: "relative", height: 260 },
  hero:         { width: "100%", height: 260 },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },

  backBtn: {
    position: "absolute",
    top: 52,
    left: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: { fontSize: 18, color: "#F0F0F0" },

  categoryPill: {
    position: "absolute",
    bottom: 16,
    left: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryPillText: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 10,
    color: "#fff",
    letterSpacing: 1,
  },

  statusPill: {
    position: "absolute",
    bottom: 16,
    right: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillLive: {
    backgroundColor: "rgba(202,255,0,0.15)",
    borderWidth: 1,
    borderColor: "rgba(202,255,0,0.3)",
  },
  statusPillPast: {
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  statusPillText: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 10,
    letterSpacing: 1,
  },
  statusPillTextLive: { color: colors.accent },
  statusPillTextPast: { color: "rgba(255,255,255,0.6)" },

  content: {
    padding: 20,
    backgroundColor: colors.pageBg,
  },

  title: {
    fontFamily: fonts.frauncesBlack,
    fontSize: 26,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 32,
    marginBottom: 16,
  },

  statsGrid: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginBottom: 16,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  statBox: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    gap: 4,
  },
  statBoxBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
  },
  statLabel: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: 1,
  },
  statValue: {
    fontFamily: fonts.dmSansBold,
    fontSize: 13,
    color: colors.textPrimary,
  },

  // Tickets card
  ticketsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
    gap: 14,
  },
  ticketsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ticketsStat: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  ticketsStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  ticketsLabel: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: 1,
  },
  ticketsValue: {
    fontFamily: fonts.frauncesBlack,
    fontSize: 26,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },

  sellThroughWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sellThroughTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.surface2,
    borderRadius: 2,
    overflow: "hidden",
  },
  sellThroughFill: {
    height: 4,
    borderRadius: 2,
  },
  sellThroughLabel: {
    fontFamily: fonts.dmMono,
    fontSize: 11,
    color: colors.textTertiary,
    minWidth: 52,
    textAlign: "right",
  },

  scanBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 13,
    alignItems: "center",
  },
  scanBtnText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 14,
    color: "#0A0A0A",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  infoIcon: { fontSize: 14 },
  infoText: {
    fontFamily: fonts.dmSans,
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },

  section:      { marginBottom: 20 },
  sectionLabel: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  description: {
    fontFamily: fonts.dmSans,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
  },

  actions: { gap: 10, marginTop: 8 },

  editBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 15,
    alignItems: "center",
  },
  editBtnText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 15,
    color: "#0A0A0A",
  },

  cancelEventBtn: {
    borderRadius: radius.lg,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,77,109,0.25)",
    backgroundColor: "rgba(255,77,109,0.08)",
  },
  cancelEventBtnText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 14,
    color: "#FF4D6D",
  },

  deleteBtn: {
    borderRadius: radius.lg,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "transparent",
  },
  deleteBtnText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 15,
    color: colors.textTertiary,
  },
});