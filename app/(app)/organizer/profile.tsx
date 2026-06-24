import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useState, useCallback } from "react";
import { router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts, radius } from "@/src/theme";
import { useAuthStore } from "@/src/store/auth-store";

const BASE_URL = "https://eventapp-ju5c.onrender.com";

type OrganizerProfile = {
  name: string;
  orgName: string;
  email: string;
  logo?: string;
  twitter?: string;
  instagram?: string;
  bio?: string;
  website?: string;
};

type MenuItem = {
  icon: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
};

export default function OrganizerProfileScreen() {
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const [profile, setProfile] = useState<OrganizerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!token) {
        setLoading(false);
        return;
      }

      let isActive = true;
      setLoading(true);

      fetch(`${BASE_URL}/api/organizers/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => {
          if (!r.ok) throw new Error(`Request failed: ${r.status}`);
          return r.json();
        })
        .then((data) => {
          if (isActive) setProfile(data.organizer ?? null);
        })
        .catch((err) => {
          console.error("Organizer profile fetch error:", err);
          if (isActive) setProfile(null);
        })
        .finally(() => {
          if (isActive) setLoading(false);
        });

      return () => {
        isActive = false;
      };
    }, [token])
  );

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/role");
        },
      },
    ]);
  };

  const initials = profile?.orgName
    ? profile.orgName.slice(0, 2).toUpperCase()
    : profile?.name
    ? profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "OR";

  const menuItems: MenuItem[] = [
    { icon: "📅", label: "My Events", onPress: () => router.push("/organizer/events" as any) },
    { icon: "＋", label: "Create Event", onPress: () => router.push("/organizer/create-event" as any) },
    { icon: "⬛", label: "Scanner", sublabel: "Scan attendee tickets at entry", onPress: () => router.push("/organizer/scanner" as any) },
    { icon: "₦", label: "Earnings", onPress: () => router.push("/organizer/earnings" as any) },
    { icon: "🔔", label: "Notifications", onPress: () => {} },
    { icon: "⚙️", label: "Settings", onPress: () => {} },
    { icon: "❓", label: "Help & Support", onPress: () => {} },
  ];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadErrorText}>Could not load profile.</Text>
        <Pressable
          style={styles.retryBtn}
          onPress={() => {
            setLoading(true);
            fetch(`${BASE_URL}/api/organizers/dashboard`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then((r) => {
                if (!r.ok) throw new Error(`Request failed: ${r.status}`);
                return r.json();
              })
              .then((data) => setProfile(data.organizer ?? null))
              .catch((err) => console.error("Organizer profile retry error:", err))
              .finally(() => setLoading(false));
          }}
        >
          <Text style={styles.retryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Pressable
          style={styles.editBtn}
          onPress={() => router.push("/organizer/edit-profile" as any)}
        >
          <Text style={styles.editBtnText}>Edit</Text>
        </Pressable>
      </View>

      <View style={styles.avatarSection}>
        {profile?.logo ? (
          <Image source={{ uri: profile.logo }} style={styles.logoImg} />
        ) : (
          <LinearGradient
            colors={["#1a1a2e", "#16213e", "#0f3460"]}
            style={styles.avatarCircle}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
        )}

        {profile?.orgName ? <Text style={styles.orgName}>{profile.orgName}</Text> : null}
        <Text style={styles.userName}>{profile?.name ?? "Organizer"}</Text>
        <Text style={styles.userEmail}>{profile?.email ?? ""}</Text>

        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>ORGANIZER</Text>
        </View>

        {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

        {(profile?.twitter || profile?.instagram || profile?.website) ? (
          <View style={styles.socialRow}>
            {profile?.website ? (
              <View style={styles.socialPill}>
                <Text style={styles.socialText}>
                  🔗 {profile.website.replace(/^https?:\/\//, "")}
                </Text>
              </View>
            ) : null}
            {profile?.twitter ? (
              <View style={styles.socialPill}>
                <Text style={styles.socialText}>𝕏 {profile.twitter}</Text>
              </View>
            ) : null}
            {profile?.instagram ? (
              <View style={styles.socialPill}>
                <Text style={styles.socialText}>◎ {profile.instagram}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.menuLabel}>ACCOUNT</Text>
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <Pressable
              key={item.label}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && styles.menuItemBorder,
              ]}
              onPress={item.onPress}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemLabel}>{item.label}</Text>
                {item.sublabel ? (
                  <Text style={styles.menuItemSublabel}>{item.sublabel}</Text>
                ) : null}
              </View>
              <Text style={styles.menuChevron}>›</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.signOutSection}>
        <Pressable style={styles.signOutBtn} onPress={handleLogout}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>

      <Text style={styles.version}>Verse v1.0.0</Text>
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pageBg },
  scroll:    { paddingBottom: 40 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.pageBg,
  },
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
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  editBtnText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 13,
    color: colors.accent,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 6,
  },
  logoImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: 4,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarText: {
    fontFamily: fonts.frauncesBold,
    fontSize: 28,
    color: "#fff",
  },
  orgName: {
    fontFamily: fonts.frauncesBlack,
    fontSize: 22,
    color: colors.textPrimary,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  userName: {
    fontFamily: fonts.dmSansMedium,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
  },
  userEmail: {
    fontFamily: fonts.dmSans,
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: "center",
  },
  roleBadge: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 2,
  },
  roleBadgeText: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1.5,
  },
  bio: {
    fontFamily: fonts.dmSans,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 4,
    maxWidth: 280,
  },
  socialRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  socialPill: {
    backgroundColor: "rgba(202,255,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(202,255,0,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  socialText: {
    fontFamily: fonts.dmSansMedium,
    fontSize: 12,
    color: colors.accent,
  },
  menuSection:  { paddingHorizontal: 20, marginBottom: 24 },
  menuLabel: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  menuCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIcon:        { fontSize: 18, width: 24, textAlign: "center" },
  menuItemContent: { flex: 1, gap: 1 },
  menuItemLabel: {
    fontFamily: fonts.dmSansMedium,
    fontSize: 15,
    color: colors.textPrimary,
  },
  menuItemSublabel: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    color: colors.textTertiary,
  },
  menuChevron: {
    fontSize: 20,
    color: colors.textTertiary,
  },
  signOutSection: { paddingHorizontal: 20, marginBottom: 16 },
  signOutBtn: {
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,77,109,0.25)",
    backgroundColor: "rgba(255,77,109,0.08)",
  },
  signOutText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 15,
    color: "#FF4D6D",
  },
  version: {
    fontFamily: fonts.dmMono,
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: "center",
  },
  loadErrorText: {
    fontFamily: fonts.dmSans,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
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
    color: colors.white,
  },
});