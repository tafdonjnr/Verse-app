import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts, radius, getCategoryTheme } from "@/src/theme";
import { useAuthStore } from "@/src/store/auth-store";

const { width } = Dimensions.get("window");
const BASE_URL = "https://eventapp-ju5c.onrender.com";

type Event = {
  _id: string;
  title: string;
  description?: string;
  date: string;
  venue?: string;
  price?: number;
  ticketsAvailable?: number;
  category?: string;
  banner?: string;
  organizer?: { _id: string; orgName?: string; name?: string; logo?: string };
};

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

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

  const handleGetTickets = async () => {
    if (!event) return;
    try {
      setPurchasing(true);
      if (!event.price || event.price === 0) {
        const res = await fetch(`${BASE_URL}/api/events/${event._id}/register`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          router.push("/attendee/tickets" as any);
        } else {
          alert(data.message ?? "Registration failed");
        }
        return;
      }
      router.push({
        pathname: "/attendee/checkout" as any,
        params: { eventId: event._id },
      });
    } catch {
      alert("Something went wrong");
    } finally {
      setPurchasing(false);
    }
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
  const bannerUri = event.banner ?? null;
  const isPast = new Date(event.date) < new Date();

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Hero */}
        <View style={styles.heroWrap}>
          {bannerUri ? (
            <Image
              source={{ uri: bannerUri }}
              style={styles.hero}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.hero, { backgroundColor: theme.bg + "33" }]} />
          )}

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.72)"]}
            style={styles.heroGradient}
          />

          {/* Back button */}
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backArrow}>←</Text>
          </Pressable>

          {/* Heart button */}
          <Pressable style={styles.heartBtn}>
            <Text style={styles.heartIcon}>♡</Text>
          </Pressable>

          {/* Category pill */}
          <View style={[styles.categoryPill, { backgroundColor: theme.bg }]}>
            <Text style={styles.categoryPillText}>
              {event.category?.toUpperCase() ?? "GENERAL"}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title + date pill */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{event.title}</Text>
            <View style={[styles.datePill, { backgroundColor: theme.bg + "22" }]}>
              <Text style={[styles.datePillText, { color: theme.bg }]}>
                {new Date(event.date).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "short",
                })}
              </Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>DATE</Text>
              <Text style={styles.statValue}>
                {new Date(event.date).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "short",
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

          {/* Venue */}
          {event.venue ? (
            <View style={styles.venueRow}>
              <Text style={styles.venueIcon}>📍</Text>
              <Text style={styles.venueText}>{event.venue}</Text>
            </View>
          ) : null}

          {/* Tickets available */}
          {event.ticketsAvailable !== undefined && (
            <View style={styles.ticketsRow}>
              <Text style={styles.ticketsIcon}>🎟</Text>
              <Text style={styles.ticketsText}>
                {event.ticketsAvailable} tickets remaining
              </Text>
            </View>
          )}

          {/* Description */}
          {event.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ABOUT</Text>
              <Text style={styles.description}>{event.description}</Text>
            </View>
          ) : null}

          {/* Organizer */}
          {event.organizer && typeof event.organizer !== "string" ? (
            <View style={styles.organizerRow}>
              <View style={styles.organizerAvatar}>
                {event.organizer.logo ? (
                  <Image
                    source={{ uri: `${BASE_URL}/uploads/${event.organizer.logo}` }}
                    style={styles.organizerAvatarImg}
                  />
                ) : (
                  <Text style={styles.organizerAvatarText}>
                    {event.organizer.orgName?.[0]?.toUpperCase() ?? "O"}
                  </Text>
                )}
              </View>
              <View style={styles.organizerInfo}>
                <Text style={styles.organizerLabel}>ORGANIZER</Text>
                <Text style={styles.organizerName}>
                  {event.organizer.orgName ?? event.organizer.name ?? ""}
                </Text>
              </View>
              <Pressable style={styles.followBtn}>
                <Text style={styles.followBtnText}>Follow</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={styles.cta}>
        <View style={styles.ctaPrice}>
          <Text style={styles.ctaPriceLabel}>PRICE</Text>
          <Text style={styles.ctaPriceValue}>{formatPrice(event.price)}</Text>
        </View>
        <Pressable
          style={[styles.ctaBtn, (purchasing || isPast) && { opacity: 0.5 }]}
          onPress={handleGetTickets}
          disabled={purchasing || isPast}
        >
          <View style={styles.ctaBtnInner}>
            <Text style={styles.ctaBtnText}>
              {isPast
                ? "Event Ended"
                : purchasing
                ? "Processing..."
                : event.price === 0 || !event.price
                ? "Register Free →"
                : "Get Tickets →"}
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.pageBg },
  center:     { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.pageBg },
  errorText:  { fontFamily: fonts.dmSans, color: colors.textSecondary },
  scroll:     { paddingBottom: 0 },

  heroWrap:     { position: "relative", height: 300 },
  hero:         { width: "100%", height: 300 },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
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

  heartBtn: {
    position: "absolute",
    top: 52,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  heartIcon: { fontSize: 18 },

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

  content: {
    padding: 20,
    backgroundColor: colors.pageBg,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  title: {
    flex: 1,
    fontFamily: fonts.frauncesBlack,
    fontSize: 26,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  datePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    marginTop: 4,
  },
  datePillText: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 11,
    letterSpacing: 0.5,
  },

  statsRow: {
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

  venueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  venueIcon: { fontSize: 14 },
  venueText: {
    fontFamily: fonts.dmSans,
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },

  ticketsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  ticketsIcon: { fontSize: 14 },
  ticketsText: {
    fontFamily: fonts.dmSansMedium,
    fontSize: 13,
    color: colors.textSecondary,
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

  organizerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  organizerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(202,255,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(202,255,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  organizerAvatarImg:  { width: 44, height: 44 },
  organizerAvatarText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 16,
    color: colors.accent,
  },
  organizerInfo:  { flex: 1, gap: 2 },
  organizerLabel: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: 1,
  },
  organizerName: {
    fontFamily: fonts.dmSansBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  followBtnText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 13,
    color: colors.textPrimary,
  },

  cta: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: colors.pageBg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 16,
  },
  ctaPrice:      { gap: 2 },
  ctaPriceLabel: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: 1,
  },
  ctaPriceValue: {
    fontFamily: fonts.frauncesBold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  ctaBtn:      { flex: 1 },
  ctaBtnInner: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 15,
    alignItems: "center",
  },
  ctaBtnText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 16,
    color: "#0A0A0A",
  },
});