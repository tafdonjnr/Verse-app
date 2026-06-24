import { Stack, Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuthStore } from "@/src/store/auth-store";

export default function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const hydrate = useAuthStore((s) => s.hydrate);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    hydrate().finally(() => setHydrated(true));
  }, []);

  // Block all routing decisions until AsyncStorage has loaded
  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0A", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color="#CAFF00" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}