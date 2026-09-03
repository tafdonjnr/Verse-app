import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Image,
    ActivityIndicator,
  } from "react-native";
  import { useLocalSearchParams, router } from "expo-router";
  import { useEffect, useState } from "react";
  import Svg, { Rect } from "react-native-svg";
  import { colors, fonts, radius, getCategoryTheme } from "@/src/theme";
  import { useAuthStore } from "@/src/store/auth-store";
  
  const BASE_URL = "https://eventapp-ju5c.onrender.com";
  
  // Verse icon mark — duplicated from splash.tsx, not yet extracted to a shared file
  function VerseMark({ size = 36 }: { size?: number }) {
    return (
      <Svg width={size} height={size * (68 / 72)} viewBox="0 0 72 68">
        {/* Left arm */}
        <Rect x="3"  y="2"  width="26" height="11" rx="4" fill={colors.accent} transform="rotate(24 16 57)" />
        <Rect x="5"  y="16" width="21" height="10" rx="4" fill={colors.accent} transform="rotate(24 15 55)" opacity="0.82" />
        <Rect x="7"  y="29" width="16" height="9"  rx="4" fill={colors.accent} transform="rotate(24 15 53)" opacity="0.58" />
        <Rect x="9"  y="40" width="12" height="8"  rx="4" fill={colors.accent} transform="rotate(24 15 51)" opacity="0.34" />
        {/* Right arm */}
        <Rect x="43" y="2"  width="26" height="11" rx="4" fill={colors.accent} transform="rotate(-24 56 57)" />
        <Rect x="46" y="16" width="21" height="10" rx="4" fill={colors.accent} transform="rotate(-24 57 55)" opacity="0.82" />
        <Rect x="49" y="29" width="16" height="9"  rx="4" fill={colors.accent} transform="rotate(-24 57 53)" opacity="0.58" />
        <Rect x="51" y="40" width="12" height="8"  rx="4" fill={colors.accent} transform="rotate(-24 57 51)" opacity="0.34" />
      </Svg>
    );
  }
  
  type Event = {
    _id: string;
    title: string;
    date: string;
    venue?: string;
    price?: number;
    category?: string;
    banner?: string;
  };
  
  export default function PurchaseSuccessScreen() {
    const { eventId, ticketCount } = useLocalSearchParams<{
      eventId: string;
      ticketCount: string;
    }>();
    const token = useAuthStore((s) => s.token);
  
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
  
    const count = parseInt(ticketCount ?? "1", 10) || 1;
  
    useEffect(() => {
      if (!eventId) {
        setLoading(false);
        return;
      }
      fetch(`${BASE_URL}/api/events/${eventId}`)
        .then((r) => r.json())
        .then(setEvent)
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [eventId]);
  
    const formatDate = (d: string) =>
      new Date(d).toLocaleDateString("en-NG", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
  
    const theme = getCategoryTheme(event?.category);
    const ticketPrice = event?.price ?? 0;
    const serviceFee = ticketPrice > 0 ? 150 + Math.round(ticketPrice * 0.035) : 0;
    const total = ticketPrice * count + (ticketPrice > 0 ? serviceFee : 0);
  
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      );
    }
  
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Verse mark */}
          <View style={styles.markRow}>
            <VerseMark size={28} />
            <Text style={styles.markText}>ERSE</Text>
          </View>
  
          {/* Accent ring */}
          <View style={styles.iconWrap}>
            <View style={[styles.iconRing, { borderColor: colors.accent + "33" }]}>
              <View style={[styles.iconInner, { backgroundColor: colors.accent }]}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            </View>
          </View>
  
          <Text style={styles.title}>You're going!</Text>
          <Text style={styles.sub}>
            {count === 1
              ? "Your ticket is confirmed and ready."
              : `${count} tickets confirmed and ready.`}
          </Text>
  
          {/* Event recap card */}
          {event && (
            <View style={styles.card}>
              <View style={[styles.cardStrip, { backgroundColor: theme.bg }]} />
              <View style={styles.cardBody}>
                {event.banner ? (
                  <Image
                    source={{ uri: event.banner }}
                    style={styles.thumb}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.thumb, { backgroundColor: theme.bg + "22" }]} />
                )}
                <View style={styles.cardInfo}>
                  <View style={[styles.catBadge, { backgroundColor: theme.bg + "22" }]}>
                    <Text style={[styles.catBadgeText, { color: theme.bg }]}>
                      {event.category?.toUpperCase() ?? "GENERAL"}
                    </Text>
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {event.title}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {formatDate(event.date)}
                    {event.venue ? `  ·  ${event.venue}` : ""}
                  </Text>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.cardFooterText}>
                  {count} × General Admission
                </Text>
                <Text style={[styles.cardFooterText, { color: colors.accent }]}>
                  {total > 0 ? `₦${total.toLocaleString()} paid` : "Free"}
                </Text>
              </View>
            </View>
          )}
  
          <Text style={styles.hint}>
            Find your QR code ticket under My Tickets
          </Text>
  
          <View style={{ height: 100 }} />
        </ScrollView>
  
        <View style={styles.cta}>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => router.replace("/attendee/tickets" as any)}
          >
            <Text style={styles.primaryBtnText}>View My Tickets →</Text>
          </Pressable>
          <Pressable onPress={() => router.replace("/attendee" as any)}>
            <Text style={styles.secondaryBtn}>Back to Events</Text>
          </Pressable>
        </View>
      </View>
    );
  }
  
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.pageBg },
    center:    { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.pageBg },
  
    scroll: {
      flexGrow: 1,
      alignItems: "center",
      paddingHorizontal: 24,
      paddingTop: 32,
    },
  
    markRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginBottom: 40,
    },
    markText: {
      fontFamily: fonts.dmSansBold,
      fontSize: 17,
      color: colors.textPrimary,
      letterSpacing: 3,
      marginTop: 1,
    },
  
    iconWrap: { marginBottom: 28 },
    iconRing: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    iconInner: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    checkmark: {
      fontSize: 32,
      color: "#0A0A0A",
      fontFamily: fonts.dmSansBold,
    },
  
    title: {
      fontFamily: fonts.frauncesBlack,
      fontSize: 32,
      color: colors.textPrimary,
      letterSpacing: -0.5,
      marginBottom: 8,
      textAlign: "center",
    },
    sub: {
      fontFamily: fonts.dmSans,
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 32,
      lineHeight: 22,
    },
  
    card: {
      width: "100%",
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: "hidden",
      marginBottom: 20,
    },
    cardStrip: { height: 3 },
    cardBody:  { flexDirection: "row", padding: 14, gap: 12 },
    thumb:     { width: 64, height: 64, borderRadius: radius.md },
    cardInfo:  { flex: 1, gap: 4 },
    catBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: radius.sm,
    },
    catBadgeText: { fontFamily: fonts.dmMonoMedium, fontSize: 9, letterSpacing: 0.8 },
    cardTitle: {
      fontFamily: fonts.frauncesBold,
      fontSize: 15,
      color: colors.textPrimary,
      lineHeight: 20,
    },
    cardMeta: { fontFamily: fonts.dmSans, fontSize: 12, color: colors.textSecondary },
    cardFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    cardFooterText: {
      fontFamily: fonts.dmSansMedium,
      fontSize: 13,
      color: colors.textSecondary,
    },
  
    hint: {
      fontFamily: fonts.dmSans,
      fontSize: 13,
      color: colors.textTertiary,
      textAlign: "center",
    },
  
    cta: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 20,
      paddingVertical: 16,
      paddingBottom: 32,
      backgroundColor: colors.pageBg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 8,
    },
    primaryBtn: {
      backgroundColor: colors.accent,
      borderRadius: radius.lg,
      paddingVertical: 16,
      alignItems: "center",
    },
    primaryBtnText: { fontFamily: fonts.dmSansBold, fontSize: 16, color: "#0A0A0A" },
    secondaryBtn: {
      fontFamily: fonts.dmSans,
      fontSize: 14,
      color: colors.textTertiary,
      textAlign: "center",
      paddingVertical: 4,
    },
  });