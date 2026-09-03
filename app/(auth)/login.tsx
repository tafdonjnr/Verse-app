import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { colors, fonts, radius } from "@/src/theme";
import { useAuthStore } from "@/src/store/auth-store";
import { loginUser } from "@/src/services/auth";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const role = useAuthStore((s) => s.selectedRole) ?? "attendee";
  const setUser = useAuthStore((s) => s.setUser);

  const handleLogin = async () => {
    if (!email || !password) return;
    try {
      setLoading(true);
      const res = await loginUser({ email, password, role });
      if (!res?.user) {
        alert("Invalid credentials");
        return;
      }
      setUser(res.user, res.token);
      router.replace(
        res.user.role === "organizer" ? "/organizer" : "/attendee"
      );
    } catch (err) {
      alert("Login failed — check your connection");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        {/* Photo */}
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800",
          }}
          style={styles.bg}
          resizeMode="cover"
        />

        {/* Gradient fades to dark */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.4)", "#0A0A0A"]}
          locations={[0.3, 0.6, 0.88]}
          style={styles.gradient}
        />

        {/* Back button */}
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        {/* Dark sheet */}
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Role badge */}
            <View style={styles.roleRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  {role.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.heading}>Welcome back.</Text>
            <Text style={styles.sub}>Sign in to your Verse account</Text>

            <View style={styles.inputs}>
              <View>
                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View>
                <Text style={styles.label}>PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            {/* Primary CTA — acid green */}
            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && { opacity: 0.88 },
                loading && { opacity: 0.6 },
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? "Signing in..." : "Continue"}
              </Text>
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social buttons — dark outlined */}
            <View style={styles.socials}>
              <Pressable style={styles.socialBtn}>
                <Text style={styles.socialIcon}>G</Text>
                <Text style={styles.socialText}>Continue with Google</Text>
              </Pressable>

              <Pressable style={styles.socialBtn}>
                <Text style={styles.socialIcon}>🍎</Text>
                <Text style={styles.socialText}>Continue with Apple</Text>
              </Pressable>
            </View>

            {/* Sign up footer */}
            <View style={styles.signupFooter}>
              <Text style={styles.signupFooterText}>
                Don't have an account?
              </Text>
              <Pressable
                style={styles.signupFooterBtn}
                onPress={() => router.push("/(auth)/sign-up" as any)}
              >
                <Text style={styles.signupFooterBtnText}>
                  Create an account
                </Text>
              </Pressable>
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    height: height * 0.55,
    top: 0,
    left: 0,
  },

  gradient: {
    position: "absolute",
    width,
    height: height * 0.72,
    top: 0,
    left: 0,
  },

  backBtn: {
    position: "absolute",
    top: 56,
    left: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  backArrow: {
    fontSize: 18,
    color: "#fff",
  },

  // Dark sheet
  sheet: {
    position: "absolute",
    bottom: 0,
    width,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 12,
    maxHeight: height * 0.72,
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
    marginBottom: 20,
  },

  roleRow: {
    marginBottom: 16,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 10,
    color: colors.accent,
    letterSpacing: 1.5,
  },

  heading: {
    fontFamily: fonts.frauncesBlack,
    fontSize: 32,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  sub: {
    fontFamily: fonts.dmSans,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },

  inputs: {
    gap: 16,
    marginBottom: 20,
  },
  label: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface2,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: fonts.dmSans,
    fontSize: 15,
    color: colors.textPrimary,
  },

  // Acid green CTA
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  primaryBtnText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 16,
    color: "#0A0A0A",
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: fonts.dmSans,
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Dark outlined social buttons
  socials: {
    gap: 10,
    marginBottom: 24,
  },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 13,
    backgroundColor: colors.surface2,
  },
  socialIcon: {
    fontSize: 16,
    fontFamily: fonts.dmSansBold,
    color: colors.textPrimary,
  },
  socialText: {
    fontFamily: fonts.dmSansMedium,
    fontSize: 15,
    color: colors.textPrimary,
  },

  // Sign up footer
  signupFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: "center",
    gap: 10,
  },
  signupFooterText: {
    fontFamily: fonts.dmMono,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  signupFooterBtn: {
    width: "100%",
    backgroundColor: colors.surface2,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: "center",
  },
  signupFooterBtnText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
});
