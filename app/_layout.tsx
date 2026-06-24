import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { View, Text } from "react-native";
import Svg, { Rect } from "react-native-svg";

import {
  useFonts,
  Fraunces_400Regular,
  Fraunces_700Bold,
  Fraunces_900Black,
} from "@expo-google-fonts/fraunces";

import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";

import {
  DMMono_400Regular,
  DMMono_500Medium,
} from "@expo-google-fonts/dm-mono";

import { useAuthStore } from "@/src/store/auth-store";
import { colors } from "@/src/theme";

export default function RootLayout() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [hydrated, setHydrated] = useState(false);
  const hasRedirected = useRef(false);

  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_700Bold,
    Fraunces_900Black,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMMono_400Regular,
    DMMono_500Medium,
  });

  useEffect(() => {
    hydrate().then(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated || !fontsLoaded) return;
    if (hasRedirected.current) return; // only redirect once on cold start

    hasRedirected.current = true;

    if (!token || !user) {
      router.replace("/(auth)/splash");
      return;
    }

    if (user.role === "organizer") {
      router.replace("/organizer");
    } else {
      router.replace("/attendee");
    }
  }, [hydrated, fontsLoaded, token, user]);

  if (!fontsLoaded || !hydrated) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: "#0A0A0A",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
      }}>
        <Svg width={72} height={68} viewBox="0 0 72 68" fill="none">
          <Rect x={3} y={2} width={26} height={11} rx={4} fill="#CAFF00" transform="rotate(24 16 57)" />
          <Rect x={5} y={16} width={21} height={10} rx={4} fill="#CAFF00" transform="rotate(24 15 55)" opacity={0.82} />
          <Rect x={7} y={29} width={16} height={9} rx={4} fill="#CAFF00" transform="rotate(24 15 53)" opacity={0.58} />
          <Rect x={9} y={40} width={12} height={8} rx={4} fill="#CAFF00" transform="rotate(24 15 51)" opacity={0.34} />
          <Rect x={43} y={2} width={26} height={11} rx={4} fill="#CAFF00" transform="rotate(-24 56 57)" />
          <Rect x={46} y={16} width={21} height={10} rx={4} fill="#CAFF00" transform="rotate(-24 57 55)" opacity={0.82} />
          <Rect x={49} y={29} width={16} height={9} rx={4} fill="#CAFF00" transform="rotate(-24 57 53)" opacity={0.58} />
          <Rect x={51} y={40} width={12} height={8} rx={4} fill="#CAFF00" transform="rotate(-24 57 51)" opacity={0.34} />
        </Svg>
        <Text style={{
          fontFamily: "DMSans_400Regular",
          fontSize: 11,
          color: "#CAFF00",
          letterSpacing: 6,
          opacity: 0.6,
        }}>
          VERSE
        </Text>
      </View>
    );
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="light" />
    </ThemeProvider>
  );
}