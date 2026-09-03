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
  import { colors, fonts, radius } from "@/src/theme";
  import { useAuthStore } from "@/src/store/auth-store";
  
  const BASE_URL = "https://eventapp-ju5c.onrender.com";
  
  type OrgProfile = {
    name: string;
    orgName: string;
    bio: string;
    twitter: string;
    instagram: string;
    website: string;
    logo: string;
  };
  
  export default function OrganizerEditProfile() {
    const token = useAuthStore((s) => s.token);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<OrgProfile>({
      name: "",
      orgName: "",
      bio: "",
      twitter: "",
      instagram: "",
      website: "",
      logo: "",
    });
    const [newLogo, setNewLogo] = useState<{
      uri: string; name: string; type: string;
    } | null>(null);
  
    const set = (key: keyof OrgProfile, val: string) =>
      setForm((f) => ({ ...f, [key]: val }));
  
    useEffect(() => {
      fetch(`${BASE_URL}/api/organizers/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          const o = data.organizer ?? {};
          setForm({
            name:      o.name ?? "",
            orgName:   o.orgName ?? "",
            bio:       o.bio ?? "",
            twitter:   o.twitter ?? "",
            instagram: o.instagram ?? "",
            website:   o.website ?? "",
            logo:      o.logo ?? "",
          });
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, []);
  
    const pickLogo = async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const ext = asset.uri.split(".").pop() ?? "jpg";
        setNewLogo({ uri: asset.uri, name: `logo.${ext}`, type: `image/${ext}` });
      }
    };
  
    const handleSave = async () => {
      if (!form.name.trim()) {
        Alert.alert("Name required", "Please enter your name.");
        return;
      }
      setSaving(true);
      try {
        const fd = new FormData();
        fd.append("name",      form.name.trim());
        fd.append("orgName",   form.orgName.trim());
        fd.append("bio",       form.bio.trim());
        fd.append("twitter",   form.twitter.trim());
        fd.append("instagram", form.instagram.trim());
        fd.append("website",   form.website.trim());
        if (newLogo) fd.append("logo", newLogo as any);
  
        const res = await fetch(`${BASE_URL}/api/organizers/profile`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
  
        const data = await res.json();
        if (res.ok) {
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
  
    const logoUri = newLogo?.uri ?? form.logo ?? null;
    const initials = form.orgName
      ? form.orgName.slice(0, 2).toUpperCase()
      : form.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "OR";
  
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
            {/* Logo */}
            <View style={styles.logoSection}>
              <Pressable style={styles.logoWrap} onPress={pickLogo}>
                {logoUri ? (
                  <Image source={{ uri: logoUri }} style={styles.logo} />
                ) : (
                  <View style={styles.logoFallback}>
                    <Text style={styles.logoInitials}>{initials}</Text>
                  </View>
                )}
                <View style={styles.logoEditBadge}>
                  <Text style={styles.logoEditIcon}>✎</Text>
                </View>
              </Pressable>
              <Text style={styles.logoHint}>Tap to change logo</Text>
            </View>
  
            {/* Identity */}
            <Section label="IDENTITY">
              <Field label="Your name" required>
                <TextInput
                  style={styles.input}
                  value={form.name}
                  onChangeText={(v) => set("name", v)}
                  placeholder="Your full name"
                  placeholderTextColor={colors.textTertiary}
                />
              </Field>
              <Field label="Organisation / brand name">
                <TextInput
                  style={styles.input}
                  value={form.orgName}
                  onChangeText={(v) => set("orgName", v)}
                  placeholder="e.g. Verse Events, Club Vertex"
                  placeholderTextColor={colors.textTertiary}
                />
              </Field>
              <Field label="Bio">
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={form.bio}
                  onChangeText={(v) => set("bio", v)}
                  placeholder="Tell attendees who you are and what you do"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={300}
                />
                <Text style={styles.charCount}>{form.bio.length}/300</Text>
              </Field>
            </Section>
  
            {/* Socials */}
            <Section label="LINKS & SOCIALS">
              <Field label="Website">
                <TextInput
                  style={styles.input}
                  value={form.website}
                  onChangeText={(v) => set("website", v)}
                  placeholder="https://yoursite.com"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </Field>
              <Field label="Twitter / X">
                <View style={styles.inputPrefix}>
                  <Text style={styles.inputPrefixText}>𝕏</Text>
                  <TextInput
                    style={[styles.input, styles.inputPrefixed]}
                    value={form.twitter}
                    onChangeText={(v) => set("twitter", v)}
                    placeholder="yourhandle"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="none"
                  />
                </View>
              </Field>
              <Field label="Instagram">
                <View style={styles.inputPrefix}>
                  <Text style={styles.inputPrefixText}>◎</Text>
                  <TextInput
                    style={[styles.input, styles.inputPrefixed]}
                    value={form.instagram}
                    onChangeText={(v) => set("instagram", v)}
                    placeholder="yourhandle"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="none"
                  />
                </View>
              </Field>
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
  
    logoSection: {
      alignItems: "center",
      paddingVertical: 28,
      gap: 8,
    },
    logoWrap: {
      position: "relative",
      width: 88,
      height: 88,
    },
    logo: {
      width: 88,
      height: 88,
      borderRadius: 44,
      borderWidth: 2,
      borderColor: colors.border,
    },
    logoFallback: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: "#1a1a2e",
      borderWidth: 2,
      borderColor: "rgba(255,255,255,0.1)",
      alignItems: "center",
      justifyContent: "center",
    },
    logoInitials: {
      fontFamily: fonts.frauncesBold,
      fontSize: 28,
      color: "#fff",
    },
    logoEditBadge: {
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
    logoEditIcon: { fontSize: 12, color: "#0A0A0A" },
    logoHint: {
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
    textarea: {
      minHeight: 90,
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
      fontSize: 15,
      color: colors.textSecondary,
      paddingHorizontal: 12,
    },
    inputPrefixed: {
      flex: 1,
      backgroundColor: "transparent",
      borderWidth: 0,
      borderRadius: 0,
    },
  });