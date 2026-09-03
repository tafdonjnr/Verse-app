import { Tabs, Redirect } from "expo-router";
import { colors } from "@/src/theme";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useAuthStore } from "@/src/store/auth-store";

function FloatingTabBar({ state, descriptors, navigation }: any) {
  const currentRoute = state.routes[state.index].name;
  const hiddenRoutes = ["create-event", "event-details", "manage-events"];
  const nestedRoute =
    state.routes[state.index]?.state?.routes?.[
      state.routes[state.index]?.state?.index ?? 0
    ]?.name ?? "";
  const hiddenNested = ["create-event", "[id]"];

  if (hiddenRoutes.includes(currentRoute) || hiddenNested.includes(nestedRoute)) {
    return null;
  }

  return (
    <View style={styles.tabBarWrapper}>
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;

          const iconName = {
            index:    isFocused ? "grid"      : "grid-outline",
            events:   isFocused ? "calendar"  : "calendar-outline",
            scanner:  isFocused ? "qr-code"   : "qr-code-outline",
            earnings: isFocused ? "bar-chart" : "bar-chart-outline",
            profile:  isFocused ? "person"    : "person-outline",
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

export default function OrganizerLayout() {
  const user = useAuthStore((s) => s.user);

  // Role guard — attendee trying to access organizer app gets redirected
  if (user && user.role !== "organizer") {
    return <Redirect href="/attendee" />;
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
      <Tabs.Screen name="events" />
      <Tabs.Screen name="scanner" />
      <Tabs.Screen name="earnings" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="create-event" options={{ href: null }} />
      <Tabs.Screen name="event" options={{ href: null }} />
      <Tabs.Screen name="event-details" options={{ href: null }} />
      <Tabs.Screen name="manage-events" options={{ href: null }} />
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