import { Tabs, Redirect } from "expo-router";
import { colors } from "@/src/theme";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useAuthStore } from "@/src/store/auth-store";

function FloatingTabBar({ state, descriptors, navigation }: any) {
  const currentRoute = state.routes[state.index];
  const currentName = currentRoute.name;

  const nestedState = currentRoute.state;
  const nestedRoute = nestedState?.routes?.[nestedState?.index ?? 0]?.name ?? "";

  const hiddenRoutes = ["checkout", "e-ticket", "event/[id]"];
  const hiddenNested = ["checkout", "e-ticket", "[id]", "event/[id]"];

  if (hiddenRoutes.includes(currentName) || hiddenNested.includes(nestedRoute)) {
    return null;
  }

  return (
    <View style={styles.tabBarWrapper}>
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;

          const iconName = {
            index:   isFocused ? "home"   : "home-outline",
            discovery: isFocused ? "compass" : "compass-outline",
            tickets: isFocused ? "ticket" : "ticket-outline",
            profile: isFocused ? "person" : "person-outline",
          }[route.name] as any;

          if (!iconName) return null;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={1}
              onPress={onPress}
              style={[styles.tabItem, isFocused && styles.tabItemActive]}
            >
              <Ionicons
                name={iconName}
                size={isFocused ? 20 : 18}
                color={isFocused ? "#0A0A0A" : "rgba(255,255,255,0.45)"}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function AttendeeLayout() {
  const user = useAuthStore((s) => s.user);

  // Role guard — organizer trying to access attendee app gets redirected
  if (user && user.role !== "attendee") {
    return <Redirect href="/organizer" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="discovery" />
      <Tabs.Screen name="tickets" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="checkout" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="e-ticket" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="purchase-success" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="event/[id]" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: "absolute",
    bottom: 28,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderRadius: 40,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 32,
  },
  tabItemActive: {
    backgroundColor: colors.accent,
  },
});