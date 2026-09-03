import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Image,
  Share,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
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
  attendeeName?: string;
  attendeeEmail?: string;
  amount?: number;
  currency?: string;
  status: string;
  qrCodePath?: string;
  createdAt: string;
};

export default function ETicketScreen() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    fetch(`${BASE_URL}/api/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setTicket(data.ticket ?? null))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [ticketId]);

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatAmount = (amount: any) =>
    amount ? `₦${Number(amount).toLocaleString()}` : "Free";

  const handleShare = async () => {
    if (!ticket) return;
    try {
      await Share.share({
        message: `My ticket for ${ticket.eventTitle} — Ticket ID: ${ticket.ticketId}`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Ticket not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>E-Ticket</Text>
        <Pressable style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareBtnText}>Share</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Ticket card */}
        <View style={styles.ticketCard}>

          {/* Gradient header — purple/blue intentional per design decisions */}
          <LinearGradient
            colors={["#6B6BC4", "#4A4A9C", "#38388A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ticketHeader}
          >
            <View style={[
              styles.statusBadge,
              ticket.status === "used" && styles.statusBadgeUsed,
              ticket.status === "cancelled" && styles.statusBadgeCancelled,
            ]}>
              <Text style={styles.statusBadgeText}>
                {ticket.status === "used"
                  ? "● USED"
                  : ticket.status === "cancelled"
                  ? "● CANCELLED"
                  : "● VALID"}
              </Text>
            </View>

            <Text style={styles.ticketEventTitle} numberOfLines={2}>
              {ticket.eventTitle}
            </Text>

            {(ticket.organizerName || ticket.organizerLogo) ? (
              <View style={styles.organizerRow}>
                {resolveOrganizerLogo(ticket.organizerLogo) ? (
                  <Image
                    source={{ uri: resolveOrganizerLogo(ticket.organizerLogo)! }}
                    style={styles.organizerLogo}
                  />
                ) : (
                  <View style={styles.organizerLogoFallback}>
                    <Text style={styles.organizerLogoFallbackText}>
                      {ticket.organizerName?.[0]?.toUpperCase() ?? "O"}
                    </Text>
                  </View>
                )}
                {ticket.organizerName ? (
                  <Text style={styles.organizerName} numberOfLines={1}>
                    {ticket.organizerName}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>DATE</Text>
                <Text style={styles.infoValue}>
                  {new Date(ticket.eventDate).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>TIME</Text>
                <Text style={styles.infoValue}>{formatTime(ticket.eventDate)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>VENUE</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {ticket.eventLocation ?? "TBA"}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>AMOUNT</Text>
                <Text style={styles.infoValue}>{formatAmount(ticket.amount)}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Tear line — circles use pageBg to cut into the dark background */}
          <View style={styles.tearLine}>
            <View style={styles.tearCircleLeft} />
            <View style={styles.tearDashes} />
            <View style={styles.tearCircleRight} />
          </View>

          {/* QR section — stays white, QR codes need white background to scan */}
          <View style={styles.qrSection}>
            <Text style={styles.qrLabel}>SCAN TO CHECK IN</Text>

            {ticket.qrCodePath ? (
              <Image
                source={{ uri: ticket.qrCodePath }}
                style={styles.qrCode}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrPlaceholderText}>QR Code unavailable</Text>
              </View>
            )}

            {ticket.status === "cancelled" && (
              <View style={styles.refundNotice}>
                <Text style={styles.refundNoticeTitle}>This event was cancelled</Text>
                <Text style={styles.refundNoticeText}>
                  A full refund has been issued to your original payment method.
                  Please allow 5–10 business days for it to appear.
                </Text>
              </View>
            )}

            <Text style={styles.orderId}>{ticket.ticketId}</Text>
            <Text style={styles.attendeeName}>
              {ticket.attendeeName ?? user?.name ?? ""}
            </Text>
          </View>
        </View>

        <Text style={styles.note}>
          Present this QR code at the event entrance. Screenshot it for offline access.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pageBg },
  center:    {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.pageBg,
  },
  errorText: { fontFamily: fonts.dmSans, color: colors.textSecondary },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
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
  backArrow: { fontSize: 18, color: colors.textPrimary },
  headerTitle: {
    fontFamily: fonts.frauncesBold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  shareBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shareBtnText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 13,
    color: colors.textPrimary,
  },

  scroll: { paddingHorizontal: 24, paddingTop: 8 },

  ticketCard: {
    borderRadius: 22,
    overflow: "hidden",
    // No shadow — doesn't read on dark bg
  },

  ticketHeader: {
    padding: 24,
    paddingBottom: 28,
    gap: 16,
  },

  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeUsed: {
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  statusBadgeCancelled: {
    backgroundColor: "rgba(190,18,60,0.3)",
  },
  statusBadgeText: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 10,
    color: "#fff",
    letterSpacing: 1,
  },

  ticketEventTitle: {
    fontFamily: fonts.frauncesBlack,
    fontSize: 26,
    color: "#fff",
    letterSpacing: -0.5,
    lineHeight: 32,
  },

  organizerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  organizerLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  organizerLogoFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  organizerLogoFallbackText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 11,
    color: "#fff",
  },
  organizerName: {
    fontFamily: fonts.dmSansMedium,
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    flex: 1,
  },

  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  infoItem:  { width: "45%", gap: 3 },
  infoLabel: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 9,
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 1.2,
  },
  infoValue: {
    fontFamily: fonts.dmSansBold,
    fontSize: 13,
    color: "#fff",
  },

  // Tear line — circles use pageBg so they appear to punch through
  tearLine: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    height: 24,
  },
  tearCircleLeft: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.pageBg,
    marginLeft: -12,
  },
  tearCircleRight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.pageBg,
    marginRight: -12,
  },
  tearDashes: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
    marginHorizontal: 8,
  },

  // QR section — white intentionally, QR codes need white bg to scan reliably
  qrSection: {
    backgroundColor: "#fff",
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  qrLabel: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 10,
    color: "#999",
    letterSpacing: 2,
  },
  qrCode: {
    width: 180,
    height: 180,
  },
  qrPlaceholder: {
    width: 180,
    height: 180,
    backgroundColor: "#f5f5f5",
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  qrPlaceholderText: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    color: "#999",
  },
  orderId: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 11,
    color: "#999",
    letterSpacing: 1,
  },
  attendeeName: {
    fontFamily: fonts.dmSansBold,
    fontSize: 15,
    color: "#1a1a1a",
  },

  note: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 20,
    paddingHorizontal: 20,
    lineHeight: 18,
  },

  refundNotice: {
    marginTop: 4,
    padding: 16,
    backgroundColor: "#FFF5F7",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#FFE8EE",
    alignItems: "center",
    gap: 6,
  },
  refundNoticeTitle: {
    fontFamily: fonts.dmSansBold,
    fontSize: 14,
    color: "#BE123C",
  },
  refundNoticeText: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    color: "#BE123C",
    textAlign: "center",
    lineHeight: 18,
    opacity: 0.8,
  },
});