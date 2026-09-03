import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";
import { router } from "expo-router";
import { fonts, colors, radius } from "@/src/theme";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Rect } from "react-native-svg";

const { width, height } = Dimensions.get("window");

// Verse icon mark — the V built from 4 stacked bars per arm
function VerseMark({ size = 36 }: { size?: number }) {
  const scale = size / 72;
  return (
    <Svg
      width={size}
      height={size * (68 / 72)}
      viewBox="0 0 72 68"
    >
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

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      {/* Background photo */}
      <Image
        source={{
          uri: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800",
        }}
        style={styles.bg}
        resizeMode="cover"
      />

      {/* Gradient overlay — transparent top to near-black bottom */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.96)"]}
        locations={[0, 0.35, 1]}
        style={styles.overlay}
      />

      {/* Content */}
      <View style={styles.content}>

        {/* Top — Verse logo mark + wordmark */}
        <View style={styles.logoRow}>
          <VerseMark size={32} />
          <Text style={styles.logoText}>ERSE</Text>
        </View>

        {/* Middle — headline */}
        <View style={styles.hero}>
          <Text style={styles.headline}>Every event,{"\n"}in one place.</Text>
          <Text style={styles.subtext}>
            Buy tickets. Discover events.{"\n"}Check in — all from your phone.
          </Text>
        </View>

        {/* Bottom — CTA */}
        <View style={styles.bottom}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && { opacity: 0.88 },
            ]}
            onPress={() => router.push("/(auth)/role" as any)}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </Pressable>

          <Text style={styles.legal}>
            By continuing you agree to our{" "}
            <Text style={styles.legalLink}>Terms</Text> and{" "}
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  bg: {
    position: "absolute",
    width,
    height,
    top: 0,
    left: 0,
  },

  overlay: {
    position: "absolute",
    width,
    height,
    top: 0,
    left: 0,
  },

  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 64,
    paddingBottom: 52,
    justifyContent: "space-between",
  },

  // Logo row — SVG mark + "ERSE" text beside it
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logoText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 22,
    color: "#fff",
    letterSpacing: 4,
    marginTop: 2,
  },

  // Hero
  hero: {
    gap: 14,
  },
  headline: {
    fontFamily: fonts.frauncesBlack,
    fontSize: 52,
    color: "#fff",
    lineHeight: 58,
    letterSpacing: -1.5,
  },
  subtext: {
    fontFamily: fonts.dmSans,
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 24,
  },

  // Bottom CTA
  bottom: {
    gap: 16,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 18,
    alignItems: "center",
  },
  buttonText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 16,
    color: "#0A0A0A",
  },

  legal: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
    lineHeight: 18,
  },
  legalLink: {
    color: "rgba(255,255,255,0.6)",
    textDecorationLine: "underline",
  },
});