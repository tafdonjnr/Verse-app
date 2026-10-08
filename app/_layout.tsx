import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, router, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
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

const AUTH_PATHS = new Set([
  "/splash",
  "/role",
  "/login",
  "/sign-up",
  "/otp",
]);

function normalizePath(pathname: string) {
  if (!pathname) return "/";
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function isAuthPath(path: string) {
  if (AUTH_PATHS.has(path)) return true;
  for (const authPath of AUTH_PATHS) {
    if (path.startsWith(`${authPath}/`)) return true;
  }
  return false;
}

function isProtectedPath(path: string) {
  return (
    path === "/attendee" ||
    path.startsWith("/attendee/") ||
    path === "/organizer" ||
    path.startsWith("/organizer/")
  );
}

export default function RootLayout() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);

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

    const path = normalizePath(pathname);
    const isAuthed = !!(token && user);

    if (!isAuthed) {
      // Protected routes require a session → login (not splash)
      if (isProtectedPath(path)) {
        router.replace("/login");
      }
      // Valid auth routes and "/" (handled by app/index) stay as-is
      return;
    }

    // Authenticated users should not linger on auth-only screens or bare root
    if (path === "/" || isAuthPath(path)) {
      router.replace(user.role === "organizer" ? "/organizer" : "/attendee");
    }
    // Valid protected URLs (including deep links / refresh) render as-is;
    // role mismatches are handled by attendee/organizer layouts.
  }, [hydrated, fontsLoaded, token, user, pathname]);

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
