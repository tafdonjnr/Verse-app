import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts, radius } from "@/src/theme";
import { useAuthStore } from "@/src/store/auth-store";

type MenuItem = {
  icon: string;
  label: string;
  value?: string;
  onPress: () => void;
};

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

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

  const menuItems: MenuItem[] = [
    {
      icon: "🎟",
      label: "My Tickets",
      onPress: () => router.push("/attendee/tickets" as any),
    },
    {
      icon: "♡",
      label: "Saved Events",
      onPress: () => router.push("/attendee/saved" as any),
    },
    {
      icon: "💳",
      label: "Payment Methods",
      onPress: () => {},
    },
    {
      icon: "🔔",
      label: "Notifications",
      onPress: () => {},
    },
    {
      icon: "⚙️",
      label: "Settings",
      onPress: () => {},
    },
    {
      icon: "❓",
      label: "Help & Support",
      onPress: () => {},
    },
  ];

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "V";

  const avatarUri = user?.avatar ?? null;

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
          onPress={() => router.push("/attendee/edit-profile" as any)}
        >
          <Text style={styles.editBtnText}>Edit</Text>
        </Pressable>
      </View>

      <View style={styles.avatarSection}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
        ) : (
          <LinearGradient
            colors={["#7B7BD6", "#4A4A9C"]}
            style={styles.avatarCircle}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
        )}
        <Text style={styles.userName}>{user?.name ?? "Verse User"}</Text>
        {user?.username ? (
          <Text style={styles.userHandle}>@{user.username}</Text>
        ) : null}
        <Text style={styles.userEmail}>{user?.email ?? ""}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>ATTENDEE</Text>
        </View>
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
              <Text style={styles.menuItemLabel}>{item.label}</Text>
              {item.value && (
                <Text style={styles.menuItemValue}>{item.value}</Text>
              )}
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
    gap: 6,
  },
  avatarImg: {
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
  userName: {
    fontFamily: fonts.frauncesBold,
    fontSize: 22,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  userHandle: {
    fontFamily: fonts.dmMono,
    fontSize: 13,
    color: colors.textSecondary,
  },
  userEmail: {
    fontFamily: fonts.dmSans,
    fontSize: 14,
    color: colors.textSecondary,
  },
  roleBadge: {
    backgroundColor: "rgba(202,255,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(202,255,0,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  roleBadgeText: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 10,
    color: colors.accent,
    letterSpacing: 1.5,
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
    paddingVertical: 15,
    backgroundColor: colors.surface,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIcon:      { fontSize: 18, width: 24, textAlign: "center" },
  menuItemLabel: {
    flex: 1,
    fontFamily: fonts.dmSansMedium,
    fontSize: 15,
    color: colors.textPrimary,
  },
  menuItemValue: {
    fontFamily: fonts.dmSans,
    fontSize: 13,
    color: colors.textSecondary,
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
});