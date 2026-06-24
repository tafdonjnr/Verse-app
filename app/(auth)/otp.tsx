// app/(auth)/otp.tsx
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { colors, fonts, radius } from "@/src/theme";
import { useAuthStore } from "@/src/store/auth-store";

const { width, height } = Dimensions.get("window");
const BASE_URL = "https://eventapp-ju5c.onrender.com";

export default function OTPScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [resendSent, setResendSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  const role = useAuthStore((s) => s.selectedRole) ?? "attendee";
  const setUser = useAuthStore((s) => s.setUser);

  const maskedEmail = email
    ? email.replace(/^(.{2}).*(@.*)$/, "$1*****$2")
    : "your email";

  const handleChange = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const updated = [...digits];
    updated[idx] = val;
    setDigits(updated);
    setError("");
    if (val && idx < 5) {
      inputs.current[idx + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === "Backspace" && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const code = digits.join("");
  const isComplete = code.length === 6;

  const handleVerify = async () => {
    if (!isComplete) return;
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // backend expects { email, code } — not { email, otp }
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Invalid code — try again");
        return;
      }

      setVerified(true);
      setUser(data.user, data.token);

      setTimeout(() => {
        router.replace(
          data.user.role === "organizer" ? "/organizer" : "/attendee"
        );
      }, 1500);
    } catch {
      setError("Something went wrong — check your connection");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendLoading) return;
    try {
      setResendLoading(true);
      setResendSent(false);
      setError("");

      const res = await fetch(`${BASE_URL}/api/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        // Reset inputs so user enters the new code cleanly
        setDigits(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
        setResendSent(true);
        // Clear the confirmation after 4 seconds
        setTimeout(() => setResendSent(false), 4000);
      } else {
        const data = await res.json();
        setError(data.message ?? "Failed to resend — try again");
      }
    } catch {
      setError("Something went wrong — check your connection");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800" }}
          style={styles.bg}
          resizeMode="cover"
        />

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.4)", colors.pageBg]}
          locations={[0.25, 0.55, 0.82]}
          style={styles.gradient}
        />

        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>

        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Success banner */}
          {verified && (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>✓ Email verified</Text>
            </View>
          )}

          {/* Resend confirmation */}
          {resendSent && !verified && (
            <View style={styles.resendBanner}>
              <Text style={styles.resendBannerText}>
                New code sent to {maskedEmail}
              </Text>
            </View>
          )}

          <View style={styles.roleRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{role.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.heading}>Check your inbox.</Text>
          <Text style={styles.sub}>
            Enter the 6-digit code sent to{" "}
            <Text style={styles.emailHighlight}>{maskedEmail}</Text>
          </Text>
          <Text style={styles.expiry}>Expires in 10 minutes</Text>

          {/* OTP inputs */}
          <View style={styles.otpRow}>
            {digits.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={(r) => { inputs.current[idx] = r; }}
                style={[
                  styles.otpInput,
                  digit ? styles.otpInputFilled : null,
                  error ? styles.otpInputError : null,
                ]}
                value={digit}
                onChangeText={(val) => handleChange(val, idx)}
                onKeyPress={(e) => handleKeyPress(e, idx)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Resend */}
          <Pressable
            onPress={handleResend}
            style={styles.resendRow}
            disabled={resendLoading}
          >
            <Text style={styles.resendText}>
              Didn't receive it?{" "}
              <Text style={[
                styles.resendLink,
                resendLoading && { opacity: 0.5 },
              ]}>
                {resendLoading ? "Sending..." : "Resend code"}
              </Text>
            </Text>
          </Pressable>

          {/* Verify button */}
          <Pressable
            style={[
              styles.primaryBtn,
              (!isComplete || loading) && styles.primaryBtnDisabled,
            ]}
            onPress={handleVerify}
            disabled={!isComplete || loading}
          >
            <Text style={styles.primaryBtnText}>
              {loading
                ? "Verifying..."
                : verified
                ? role === "organizer"
                  ? "Enter Organizer Dashboard →"
                  : "Enter Verse →"
                : "Continue"}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pageBg,
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
    color: "#F0F0F0",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    width,
    backgroundColor: colors.pageBg,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface2,
    alignSelf: "center",
    marginBottom: 20,
  },

  // Verified banner
  successBanner: {
    backgroundColor: "rgba(202,255,0,0.1)",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(202,255,0,0.25)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  successText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 14,
    color: colors.accent,
  },

  // Resend confirmation banner
  resendBanner: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  resendBannerText: {
    fontFamily: fonts.dmSans,
    fontSize: 13,
    color: colors.textSecondary,
  },

  roleRow:   { marginBottom: 16 },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(202,255,0,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(202,255,0,0.2)",
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
    marginBottom: 6,
  },
  sub: {
    fontFamily: fonts.dmSans,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  emailHighlight: {
    fontFamily: fonts.dmSansBold,
    color: colors.textPrimary,
  },
  expiry: {
    fontFamily: fonts.dmMono,
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 4,
    marginBottom: 28,
  },

  otpRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  otpInput: {
    flex: 1,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontFamily: fonts.frauncesBold,
    fontSize: 22,
    color: colors.textPrimary,
  },
  otpInputFilled: {
    borderColor: colors.accent,
    backgroundColor: "rgba(202,255,0,0.06)",
  },
  otpInputError: {
    borderColor: "#FF4D6D",
    backgroundColor: "rgba(255,77,109,0.08)",
  },

  errorText: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    color: "#FF4D6D",
    marginBottom: 8,
  },

  resendRow:   { marginBottom: 24 },
  resendText: {
    fontFamily: fonts.dmSans,
    fontSize: 13,
    color: colors.textSecondary,
  },
  resendLink: {
    fontFamily: fonts.dmSansBold,
    color: colors.textPrimary,
  },

  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnDisabled: {
    opacity: 0.35,
  },
  primaryBtnText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 16,
    color: "#0A0A0A",
  },
});