import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
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
  category?: string;
  banner?: string;
  organizer?: { orgName?: string };
};

type PaymentState = "idle" | "processing" | "failed";

export default function CheckoutScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");

  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    fetch(`${BASE_URL}/api/events/${eventId}`)
      .then((r) => r.json())
      .then(setEvent)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [eventId]);

  const formatPrice = (price: any) =>
    price === undefined || price === null || price === 0
      ? "Free"
      : `₦${Number(price).toLocaleString()}`;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-NG", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const ticketPrice = event?.price ?? 0;
  const serviceFee = ticketPrice > 0 ? 150 + Math.round(ticketPrice * 0.035) : 0;
  const subtotal = ticketPrice * quantity;
  const total = subtotal + serviceFee;

  const handlePay = async () => {
    if (!event) return;
    try {
      setPaymentState("processing");
      const res = await fetch(`${BASE_URL}/api/payments/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ eventId: event._id, ticketCount: quantity }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message ?? "Payment initiation failed");
        setPaymentState("idle");
        return;
      }

      const { authorizationUrl, reference } = data;
      await WebBrowser.openBrowserAsync(authorizationUrl);
      await pollPaymentStatus(reference);
    } catch {
      alert("Something went wrong — try again");
      setPaymentState("idle");
    }
  };

  const pollPaymentStatus = async (reference: string) => {
    try {
      for (let i = 0; i < 5; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const res = await fetch(`${BASE_URL}/api/payments/verify/${reference}`);
        const data = await res.json();

        if (data.status === "success") {
          // Route to the dedicated success screen — event detail and
          // checkout are left completely untouched for future visits
          router.replace({
            pathname: "/attendee/purchase-success" as any,
            params: {
              eventId: event!._id,
              ticketCount: String(quantity),
            },
          });
          return;
        }
        if (data.status === "failed") {
          setPaymentState("failed");
          return;
        }
      }
      // Timed out — still route to success optimistically, webhook will
      // have processed by the time the user checks My Tickets
      router.replace({
        pathname: "/attendee/purchase-success" as any,
        params: {
          eventId: event!._id,
          ticketCount: String(quantity),
        },
      });
    } catch (err) {
      console.error("Poll error:", err);
      setPaymentState("idle");
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

  // ── Failed screen ─────────────────────────────────────────────────────────
  if (paymentState === "failed") {
    return (
      <View style={styles.container}>
        <View style={styles.successScroll}>
          <View style={styles.successIconWrap}>
            <View style={[styles.successIconRing, { borderColor: "#FF2D5533" }]}>
              <View style={[styles.successIconInner, { backgroundColor: "#FF2D55" }]}>
                <Text style={styles.successCheckmark}>✕</Text>
              </View>
            </View>
          </View>
          <Text style={styles.successTitle}>Payment failed</Text>
          <Text style={styles.successSub}>
            Your card wasn't charged. Please try again.
          </Text>
        </View>
        <View style={styles.cta}>
          <Pressable
            style={styles.payBtn}
            onPress={() => setPaymentState("idle")}
          >
            <Text style={styles.payBtnText}>Try Again</Text>
          </Pressable>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.secondaryBtn}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Checkout screen ───────────────────────────────────────────────────────
  const theme = getCategoryTheme(event.category);
  const processing = paymentState === "processing";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.eventCard}>
          <View style={[styles.eventCardStrip, { backgroundColor: theme.bg }]} />
          <View style={styles.eventCardBody}>
            {event.banner ? (
              <Image
                source={{ uri: event.banner }}
                style={styles.eventThumb}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.eventThumb, { backgroundColor: theme.bg + "22" }]} />
            )}
            <View style={styles.eventInfo}>
              <View style={[styles.catBadge, { backgroundColor: theme.bg + "22" }]}>
                <Text style={[styles.catBadgeText, { color: theme.bg }]}>
                  {event.category?.toUpperCase() ?? "GENERAL"}
                </Text>
              </View>
              <Text style={styles.eventTitle} numberOfLines={2}>
                {event.title}
              </Text>
              <Text style={styles.eventMeta}>
                {formatDate(event.date)}
                {event.venue ? `  ·  ${event.venue}` : ""}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TICKETS</Text>
          <View style={styles.quantityRow}>
            <View style={styles.quantityInfo}>
              <Text style={styles.quantityTitle}>General Admission</Text>
              <Text style={styles.quantityPrice}>
                {formatPrice(event.price)} each
              </Text>
            </View>
            <View style={styles.quantityControls}>
              <Pressable
                style={[styles.qtyBtn, quantity <= 1 && styles.qtyBtnDisabled]}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                <Text style={styles.qtyBtnText}>−</Text>
              </Pressable>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <Pressable
                style={[styles.qtyBtn, quantity >= 10 && styles.qtyBtnDisabled]}
                onPress={() =>
                  setQuantity((q) =>
                    Math.min(
                      10,
                      event.ticketsAvailable
                        ? Math.min(q + 1, event.ticketsAvailable)
                        : q + 1
                    )
                  )
                }
                disabled={quantity >= 10}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ORDER SUMMARY</Text>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>
                {quantity} × {formatPrice(event.price)}
              </Text>
              <Text style={styles.summaryVal}>₦{subtotal.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Service fee</Text>
              <Text style={styles.summaryVal}>₦{serviceFee.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotal}>Total</Text>
              <Text style={styles.summaryTotalVal}>₦{total.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {event.ticketsAvailable !== undefined && (
          <Text style={styles.availableNote}>
            🎟 {event.ticketsAvailable} tickets remaining
          </Text>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.cta}>
        <Pressable
          style={[styles.payBtn, processing && { opacity: 0.6 }]}
          onPress={handlePay}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#0A0A0A" />
          ) : (
            <Text style={styles.payBtnText}>
              Pay ₦{total.toLocaleString()} →
            </Text>
          )}
        </Pressable>
        <Text style={styles.secureNote}>🔒 Secured by Paystack</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.pageBg },
  center:     { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.pageBg },
  errorText:  { fontFamily: fonts.dmSans, color: colors.textSecondary },
  scroll:     { padding: 20 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.pageBg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow:   { fontSize: 18, color: colors.textPrimary },
  headerTitle: {
    fontFamily: fonts.frauncesBold,
    fontSize: 18,
    color: colors.textPrimary,
  },

  // Failed screen (success screen moved to purchase-success.tsx)
  successScroll: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  successIconWrap: { marginBottom: 28 },
  successIconRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  successIconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  successCheckmark: {
    fontSize: 32,
    color: "#0A0A0A",
    fontFamily: fonts.dmSansBold,
  },
  successTitle: {
    fontFamily: fonts.frauncesBlack,
    fontSize: 32,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: "center",
  },
  successSub: {
    fontFamily: fonts.dmSans,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  secondaryBtn: {
    fontFamily: fonts.dmSans,
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: "center",
    paddingVertical: 4,
  },

  eventCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: 24,
    backgroundColor: colors.surface,
  },
  eventCardStrip: { height: 3 },
  eventCardBody:  { flexDirection: "row", padding: 14, gap: 12 },
  eventThumb:     { width: 64, height: 64, borderRadius: radius.md },
  eventInfo:      { flex: 1, gap: 4 },
  catBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  catBadgeText: { fontFamily: fonts.dmMonoMedium, fontSize: 9, letterSpacing: 0.8 },
  eventTitle: {
    fontFamily: fonts.frauncesBold,
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  eventMeta: { fontFamily: fonts.dmSans, fontSize: 12, color: colors.textSecondary },

  section:      { marginBottom: 24 },
  sectionLabel: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  quantityInfo:  { gap: 3 },
  quantityTitle: { fontFamily: fonts.dmSansBold, fontSize: 15, color: colors.textPrimary },
  quantityPrice: { fontFamily: fonts.dmSans, fontSize: 13, color: colors.textSecondary },
  quantityControls: { flexDirection: "row", alignItems: "center", gap: 16 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnDisabled: { backgroundColor: colors.surface2 },
  qtyBtnText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 18,
    color: "#0A0A0A",
    lineHeight: 22,
  },
  qtyValue: {
    fontFamily: fonts.frauncesBold,
    fontSize: 20,
    color: colors.textPrimary,
    minWidth: 24,
    textAlign: "center",
  },

  summaryBox: {
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    gap: 10,
  },
  summaryRow:      { flexDirection: "row", justifyContent: "space-between" },
  summaryKey:      { fontFamily: fonts.dmSans, fontSize: 14, color: colors.textSecondary },
  summaryVal:      { fontFamily: fonts.dmSansMedium, fontSize: 14, color: colors.textPrimary },
  summaryDivider:  { height: 1, backgroundColor: colors.border },
  summaryTotal:    { fontFamily: fonts.dmSansBold, fontSize: 15, color: colors.textPrimary },
  summaryTotalVal: { fontFamily: fonts.frauncesBold, fontSize: 18, color: colors.accent },

  availableNote: {
    fontFamily: fonts.dmSans,
    fontSize: 13,
    color: colors.textSecondary,
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
  payBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  payBtnText: { fontFamily: fonts.dmSansBold, fontSize: 16, color: "#0A0A0A" },
  secureNote: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: "center",
  },
});