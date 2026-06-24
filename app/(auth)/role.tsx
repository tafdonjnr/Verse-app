import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { colors, fonts, radius } from "@/src/theme";
import { useAuthStore } from "@/src/store/auth-store";

const { width, height } = Dimensions.get("window");

export default function RoleScreen() {
  const setSelectedRole = useAuthStore((s) => s.setSelectedRole);

  const handleSelect = (role: "attendee" | "organizer") => {
    setSelectedRole(role);
    router.push("/(auth)/login" as any);
  };

  return (
    <View style={styles.container}>
      {/* Photo background */}
      <Image
        source={{
          uri: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800",
        }}
        style={styles.bg}
        resizeMode="cover"
      />

      {/* Gradient fade into dark */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.4)", "#0A0A0A"]}
        locations={[0.3, 0.6, 0.88]}
        style={styles.gradient}
      />

      {/* Bottom sheet — dark surface */}
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <Text style={styles.heading}>Join Verse</Text>
        <Text style={styles.sub}>Who are you joining as?</Text>

        <View style={styles.buttons}>
          {/* Attendee — outlined */}
          <Pressable
            style={({ pressed }) => [
              styles.btn,
              styles.btnOutline,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => handleSelect("attendee")}
          >
            <View style={styles.btnTextBlock}>
              <Text style={styles.btnOutlineLabel}>Attendee</Text>
              <Text style={styles.btnSub}>Discover & book events</Text>
            </View>
            <Text style={styles.btnChevronOutline}>→</Text>
          </Pressable>

          {/* Organizer — acid green filled */}
          <Pressable
            style={({ pressed }) => [
              styles.btn,
              styles.btnFilled,
              pressed && { opacity: 0.88 },
            ]}
            onPress={() => handleSelect("organizer")}
          >
            <View style={styles.btnTextBlock}>
              <Text style={styles.btnFilledLabel}>Organizer</Text>
              <Text style={[styles.btnSub, { color: "rgba(10,10,10,0.55)" }]}>
                Create & manage events
              </Text>
            </View>
            <Text style={styles.btnChevronFilled}>→</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },

  bg: {
    position: "absolute",
    width,
    height: height * 0.62,
    top: 0,
    left: 0,
  },

  gradient: {
    position: "absolute",
    width,
    height: height * 0.78,
    top: 0,
    left: 0,
  },

  // Dark sheet — matches app surface color
  sheet: {
    position: "absolute",
    bottom: 0,
    width,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: 24,
    paddingBottom: 52,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
  },

  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 24,
  },

  heading: {
    fontFamily: fonts.frauncesBlack,
    fontSize: 36,
    color: colors.textPrimary,
    letterSpacing: -1,
    marginBottom: 4,
  },

  sub: {
    fontFamily: fonts.dmSans,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 28,
  },

  buttons: {
    gap: 12,
  },

  btn: {
    borderRadius: radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // Attendee — dark outlined
  btnOutline: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
  },

  // Organizer — acid green
  btnFilled: {
    backgroundColor: colors.accent,
  },

  btnTextBlock: {
    gap: 2,
  },

  btnOutlineLabel: {
    fontFamily: fonts.dmSansBold,
    fontSize: 16,
    color: colors.textPrimary,
  },

  btnFilledLabel: {
    fontFamily: fonts.dmSansBold,
    fontSize: 16,
    color: "#0A0A0A",
  },

  btnSub: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    color: colors.textSecondary,
  },

  btnChevronOutline: {
    fontSize: 18,
    color: colors.textPrimary,
  },

  btnChevronFilled: {
    fontSize: 18,
    color: "#0A0A0A",
  },
});