import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { colors, fonts, radius } from "@/src/theme";
import { useAuthStore } from "@/src/store/auth-store";

const BASE_URL = "https://eventapp-ju5c.onrender.com";

const ABUJA_AREAS = [
  "Wuse", "Wuse 2", "Maitama", "Asokoro", "Garki", "CBD",
  "Jabi", "Utako", "Gwarinpa", "Kubwa", "Lokogoma", "Gudu",
  "Karu", "Nyanya", "Jikwoyi", "Lugbe", "Kaura", "Apo",
  "Galadimawa", "Katampe", "Life Camp", "Dawaki", "Other",
];

const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Non-binary", value: "non-binary" },
  { label: "Prefer not to say", value: "prefer-not-to-say" },
];

type Profile = {
  name: string;
  username: string;
  phone: string;
  bio: string;
  avatar: string;
  dob: Date | null;
  gender: string;
  showAttendance: boolean;
  locationArea: string;
};

export default function AttendeeEditProfile() {
  const token = useAuthStore((s) => s.token);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);

  const [form, setForm] = useState<Profile>({
    name: "",
    username: "",
    phone: "",
    bio: "",
    avatar: "",
    dob: null,
    gender: "",
    showAttendance: true,
    locationArea: "",
  });

  const [newAvatar, setNewAvatar] = useState<{
    uri: string; name: string; type: string;
  } | null>(null);

  const set = (key: keyof Profile, val: any) =>
    setForm((f) => ({ ...f, [key]: val }));

  useEffect(() => {
    fetch(`${BASE_URL}/api/attendees/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setForm({
          name: data.name ?? "",
          username: data.username ?? "",
          phone: data.phone ?? "",
          bio: data.bio ?? "",
          avatar: data.avatar ?? "",
          dob: data.dob ? new Date(data.dob) : null,
          gender: data.gender ?? "",
          showAttendance: data.showAttendance ?? true,
          locationArea: data.location?.area ?? "",
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const ext = asset.uri.split(".").pop() ?? "jpg";
      setNewAvatar({
        uri: asset.uri,
        name: `avatar.${ext}`,
        type: `image/${ext}`,
      });
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert("Name required", "Please enter your display name.");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("phone", form.phone.trim());
      fd.append("bio", form.bio.trim());
      fd.append("gender", form.gender);
      fd.append("showAttendance", String(form.showAttendance));
      fd.append("locationCity", "Abuja");
      fd.append("locationArea", form.locationArea);
      if (form.username.trim()) fd.append("username", form.username.trim());
      if (form.dob) fd.append("dob", form.dob.toISOString());
      if (newAvatar) fd.append("avatar", newAvatar as any);

      const res = await fetch(`${BASE_URL}/api/attendees/profile`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const text = await res.text();
      console.log("Raw response:", text);
      
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        Alert.alert("Error", `Server returned: ${text.slice(0, 200)}`);
        return;
      }
      if (res.ok) {
        const setUser = useAuthStore.getState().setUser;
        const currentToken = useAuthStore.getState().token;
        const currentUser = useAuthStore.getState().user;
        setUser(
          {
            ...currentUser,
            ...data.attendee,
            id: data.attendee.id,
            role: currentUser?.role ?? "attendee",
          },
          currentToken
        );

        Alert.alert("Saved", "Profile updated successfully.", [
          { text: "Done", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Error", data.message ?? "Failed to save");
      }
    } catch {
      Alert.alert("Error", "Network error — try again");
    } finally {
      setSaving(false);
    }
  };

  // These must be declared before the loading-state early return,
  // so they're in scope for the JSX below regardless of render path
  const avatarUri = newAvatar?.uri ?? form.avatar ?? null;
  const initials = form.name
    ? form.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "V";

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Pressable
            style={[styles.saveBtn, saving && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={colors.accent} size="small" />
              : <Text style={styles.saveBtnText}>Save</Text>
            }
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <Pressable style={styles.avatarWrap} onPress={pickAvatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                <Text style={styles.avatarEditIcon}>✎</Text>
              </View>
            </Pressable>
            <Text style={styles.avatarHint}>Tap to change photo</Text>
          </View>

          {/* Basic info */}
          <Section label="BASIC INFO">
            <Field label="Display name" required>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(v) => set("name", v)}
                placeholder="Your full name"
                placeholderTextColor={colors.textTertiary}
              />
            </Field>

            <Field label="Username">
              <View style={styles.inputPrefix}>
                <Text style={styles.inputPrefixText}>@</Text>
                <TextInput
                  style={[styles.input, styles.inputPrefixed]}
                  value={form.username}
                  onChangeText={(v) =>
                    set("username", v.toLowerCase().replace(/[^a-z0-9_.]/g, ""))
                  }
                  placeholder="yourhandle"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                />
              </View>
            </Field>

            <Field label="Phone">
              <TextInput
                style={styles.input}
                value={form.phone}
                onChangeText={(v) => set("phone", v)}
                placeholder="+234 800 000 0000"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
              />
            </Field>

            <Field label="Bio">
              <TextInput
                style={[styles.input, styles.textarea]}
                value={form.bio}
                onChangeText={(v) => set("bio", v)}
                placeholder="Tell people a bit about yourself"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={200}
              />
              <Text style={styles.charCount}>{form.bio.length}/200</Text>
            </Field>
          </Section>

          {/* Personal */}
          <Section label="PERSONAL">
            <Field label="Date of birth">
              <Pressable
                style={styles.input}
                onPress={() => setShowDobPicker(true)}
              >
                <Text style={form.dob ? styles.inputText : styles.inputPlaceholder}>
                  {form.dob
                    ? form.dob.toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Select date of birth"}
                </Text>
              </Pressable>
              {showDobPicker && (
                <DateTimePicker
                  value={form.dob ?? new Date(2000, 0, 1)}
                  mode="date"
                  maximumDate={new Date()}
                  minimumDate={new Date(1940, 0, 1)}
                  onChange={(_, selected) => {
                    setShowDobPicker(false);
                    if (selected) set("dob", selected);
                  }}
                />
              )}
            </Field>

            <Field label="Gender">
              <View style={styles.optionRow}>
                {GENDER_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    style={[
                      styles.optionChip,
                      form.gender === opt.value && styles.optionChipActive,
                    ]}
                    onPress={() => set("gender", opt.value)}
                  >
                    <Text style={[
                      styles.optionChipText,
                      form.gender === opt.value && styles.optionChipTextActive,
                    ]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Field>
          </Section>

          {/* Location */}
          <Section label="LOCATION">
            <Field label="Area in Abuja">
              <View style={styles.areaGrid}>
                {ABUJA_AREAS.map((area) => (
                  <Pressable
                    key={area}
                    style={[
                      styles.optionChip,
                      form.locationArea === area && styles.optionChipActive,
                    ]}
                    onPress={() => set("locationArea", area)}
                  >
                    <Text style={[
                      styles.optionChipText,
                      form.locationArea === area && styles.optionChipTextActive,
                    ]}>
                      {area}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Field>
          </Section>

          {/* Privacy */}
          <Section label="PRIVACY">
            <Pressable
              style={styles.toggleRow}
              onPress={() => set("showAttendance", !form.showAttendance)}
            >
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Show attendance publicly</Text>
                <Text style={styles.toggleSub}>
                  Let others see which events you're going to
                </Text>
              </View>
              <View style={[
                styles.toggleSwitch,
                form.showAttendance && styles.toggleSwitchOn,
              ]}>
                <View style={[
                  styles.toggleThumb,
                  form.showAttendance && styles.toggleThumbOn,
                ]} />
              </View>
            </Pressable>
          </Section>

          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Field({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}{required && <Text style={{ color: colors.accent }}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pageBg },
  center:    { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.pageBg },
  scroll:    { paddingHorizontal: 20, paddingBottom: 40 },

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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: { fontSize: 18, color: colors.textPrimary },
  headerTitle: {
    fontFamily: fonts.frauncesBold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  saveBtnText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 13,
    color: colors.accent,
  },

  avatarSection: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 8,
  },
  avatarWrap: {
    position: "relative",
    width: 88,
    height: 88,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(202,255,0,0.1)",
    borderWidth: 2,
    borderColor: "rgba(202,255,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontFamily: fonts.frauncesBold,
    fontSize: 28,
    color: colors.accent,
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.pageBg,
  },
  avatarEditIcon: {
    fontSize: 12,
    color: "#0A0A0A",
  },
  avatarHint: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    color: colors.textTertiary,
  },

  section:      { marginBottom: 24 },
  sectionLabel: {
    fontFamily: fonts.dmMonoMedium,
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },

  field: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  fieldLabel: {
    fontFamily: fonts.dmSans,
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.dmSansMedium,
    fontSize: 15,
    color: colors.textPrimary,
    justifyContent: "center",
  },
  inputText: {
    fontFamily: fonts.dmSansMedium,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputPlaceholder: {
    fontFamily: fonts.dmSans,
    fontSize: 15,
    color: colors.textTertiary,
  },
  textarea: {
    minHeight: 80,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  charCount: {
    fontFamily: fonts.dmMono,
    fontSize: 10,
    color: colors.textTertiary,
    textAlign: "right",
    marginTop: 2,
  },
  inputPrefix: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  inputPrefixText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 16,
    color: colors.textSecondary,
    paddingHorizontal: 12,
  },
  inputPrefixed: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderRadius: 0,
  },

  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  areaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBg,
  },
  optionChipActive: {
    backgroundColor: "rgba(202,255,0,0.1)",
    borderColor: "rgba(202,255,0,0.3)",
  },
  optionChipText: {
    fontFamily: fonts.dmSansMedium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  optionChipTextActive: {
    color: colors.accent,
    fontFamily: fonts.dmSansBold,
  },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
  },
  toggleInfo: { flex: 1, gap: 3 },
  toggleLabel: {
    fontFamily: fonts.dmSansMedium,
    fontSize: 15,
    color: colors.textPrimary,
  },
  toggleSub: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    color: colors.textSecondary,
  },
  toggleSwitch: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  toggleSwitchOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.textSecondary,
  },
  toggleThumbOn: {
    backgroundColor: "#0A0A0A",
    alignSelf: "flex-end",
  },
});