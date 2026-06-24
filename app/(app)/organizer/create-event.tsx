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
  PanResponder,
  Animated,
} from "react-native";
import { useState, useEffect, useRef, useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { colors, fonts, radius } from "@/src/theme";
import { useAuthStore } from "@/src/store/auth-store";
import React from "react";

const BASE_URL = "https://eventapp-ju5c.onrender.com";
const BANNER_HEIGHT = 160;

type BannerOffset = { x: number; y: number };
const DEFAULT_BANNER_POSITION: BannerOffset = { x: 0, y: 0 };

function sanitizePaidPrice(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return "";
  const n = parseInt(digits, 10);
  if (!Number.isFinite(n) || n <= 0) return "";
  return String(n);
}

function resolveSubmitPrice(isPaid: boolean, price: string): string {
  if (!isPaid) return "0";
  return sanitizePaidPrice(price) || "0";
}

function parsePaidPriceAmount(price: string): number {
  const n = parseInt(sanitizePaidPrice(price), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function parseBannerPosition(raw: unknown): BannerOffset {
  if (raw && typeof raw === "object" && "x" in raw && "y" in raw) {
    const p = raw as { x: unknown; y: unknown };
    return { x: Number(p.x) || 0, y: Number(p.y) || 0 };
  }
  if (typeof raw === "string") {
    try { return parseBannerPosition(JSON.parse(raw)); }
    catch { return { ...DEFAULT_BANNER_POSITION }; }
  }
  return { ...DEFAULT_BANNER_POSITION };
}

function deriveIsPaidFromEventPrice(price: unknown): boolean {
  const n = Number(price ?? 0);
  return Number.isFinite(n) && n > 0;
}

function getWizardStepHint(step: number, data: WizardData): string | null {
  if (step === 0) {
    if (!data.title.trim()) return "Enter an event name to continue";
    if (!data.description.trim()) return "Add a description to continue";
  }
  if (step === 1 && !data.venue.trim()) return "Enter a venue to continue";
  return null;
}

function appendBannerPosition(form: FormData, position: BannerOffset) {
  form.append("bannerPosition", JSON.stringify(position));
}

function BannerPreview({
  uri,
  offset,
  onOffsetChange,
  height = BANNER_HEIGHT,
}: {
  uri: string;
  offset: BannerOffset;
  onOffsetChange: (o: BannerOffset) => void;
  height?: number;
}) {
  const dragStart = useRef<BannerOffset>({ x: 0, y: 0 });
  const hintOpacity = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleHideHint = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      Animated.timing(hintOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 3000);
  };

  const revealHint = () => {
    Animated.timing(hintOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    scheduleHideHint();
  };

  useEffect(() => {
    scheduleHideHint();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          dragStart.current = { x: offset.x, y: offset.y };
          revealHint();
        },
        onPanResponderMove: (_, gesture) => {
          onOffsetChange({
            x: Math.max(-100, Math.min(100, dragStart.current.x + gesture.dx)),
            y: Math.max(-60, Math.min(60, dragStart.current.y + gesture.dy)),
          });
        },
        onPanResponderRelease: (_, gesture) => {
          if (Math.abs(gesture.dx) < 6 && Math.abs(gesture.dy) < 6) revealHint();
        },
      }),
    [offset.x, offset.y, onOffsetChange]
  );

  return (
    <View style={[styles.bannerFrame, { height }]} {...panResponder.panHandlers}>
      <Image
        source={{ uri }}
        style={[
          styles.bannerImagePositioned,
          {
            transform: [
              { translateX: offset.x },
              { translateY: offset.y },
              { scale: 1.18 },
            ],
          },
        ]}
        resizeMode="cover"
      />
      <Animated.View
        style={[styles.bannerDragHint, { opacity: hintOpacity }]}
        pointerEvents="none"
      >
        <Text style={styles.bannerDragHintText}>Drag to reposition</Text>
      </Animated.View>
    </View>
  );
}

const CATEGORIES = [
  { value: "concert",       label: "Concert" },
  { value: "festival",      label: "Festival" },
  { value: "rave",          label: "Rave" },
  { value: "outdoor",       label: "Outdoor" },
  { value: "food-festival", label: "Food" },
  { value: "tech",          label: "Tech" },
  { value: "sports",        label: "Sports" },
  { value: "trade-fair",    label: "Trade Fair" },
  { value: "popup",         label: "Pop-up" },
  { value: "funfair",       label: "Funfair" },
  { value: "color-festival", label: "Color Fest" },
  { value: "general",       label: "General" },
];

type WizardData = {
  title: string;
  description: string;
  category: string;
  date: Date;
  venue: string;
  isPaid: boolean;
  price: string;
  ticketsAvailable: string;
  banner: { uri: string; name: string; type: string } | null;
  bannerPosition: BannerOffset;
};

const EMPTY: WizardData = {
  title: "",
  description: "",
  category: "general",
  date: new Date(),
  venue: "",
  isPaid: false,
  price: "",
  ticketsAvailable: "",
  banner: null,
  bannerPosition: { ...DEFAULT_BANNER_POSITION },
};

export default function CreateEventScreen() {
  const { id, edit } = useLocalSearchParams<{ id?: string; edit?: string }>();
  const isEdit = edit === "true" && !!id;
  return isEdit ? <EditScreen eventId={id!} /> : <WizardScreen />;
}

// ─── WIZARD ──────────────────────────────────────────────────────────────────

function WizardScreen() {
  const token = useAuthStore((s) => s.token);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const set = (key: keyof WizardData, val: any) =>
    setData((d) => ({ ...d, [key]: val }));

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const ext = asset.uri.split(".").pop() ?? "jpg";
      setData((d) => ({
        ...d,
        bannerPosition: { ...DEFAULT_BANNER_POSITION },
        banner: { uri: asset.uri, name: `banner.${ext}`, type: `image/${ext}` },
      }));
    }
  };

  const canNext = [
    data.title.trim().length > 0 && data.description.trim().length > 0,
    data.venue.trim().length > 0,
    true,
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("title", data.title.trim());
      form.append("description", data.description.trim());
      form.append("category", data.category);
      form.append("date", data.date.toISOString());
      form.append("venue", data.venue.trim());
      form.append("price", resolveSubmitPrice(data.isPaid, data.price));
      form.append("ticketsAvailable", data.ticketsAvailable || "0");
      appendBannerPosition(form, data.bannerPosition);
      if (data.banner) form.append("banner", data.banner as any);

      const res = await fetch(`${BASE_URL}/api/events`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (res.ok) {
        Alert.alert("Event Created", "Your event is now live.", [
          { text: "Done", onPress: () => router.replace("/organizer") },
        ]);
      } else {
        const err = await res.json();
        Alert.alert("Error", err.message ?? "Failed to create event");
      }
    } catch {
      Alert.alert("Error", "Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = ["Details", "Location & Time", "Tickets"];
  const stepHint = step < 2 ? getWizardStepHint(step, data) : null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.wizardHeader}>
          <Pressable
            style={styles.backBtn}
            onPress={() => step === 0 ? router.back() : setStep(step - 1)}
          >
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
          <View style={styles.stepIndicatorRow}>
            {steps.map((s, i) => (
              <View key={i} style={styles.stepIndicatorItem}>
                <View style={[
                  styles.stepDot,
                  i === step && styles.stepDotActive,
                  i < step && styles.stepDotDone,
                ]} />
                <Text style={[
                  styles.stepLabel,
                  i === step && styles.stepLabelActive,
                ]}>{s}</Text>
              </View>
            ))}
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.wizardContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 && <Step0 data={data} set={set} pickImage={pickImage} />}
          {step === 1 && (
            <Step1
              data={data}
              set={set}
              showDatePicker={showDatePicker}
              setShowDatePicker={setShowDatePicker}
              showTimePicker={showTimePicker}
              setShowTimePicker={setShowTimePicker}
            />
          )}
          {step === 2 && <Step2 data={data} set={set} />}
        </ScrollView>

        <View style={styles.wizardFooter}>
          {!canNext[step] && stepHint && (
            <Text style={styles.ctaHint}>{stepHint}</Text>
          )}
          {step < 2 ? (
            <Pressable
              style={[styles.primaryBtn, !canNext[step] && styles.primaryBtnDisabled]}
              onPress={() => setStep(step + 1)}
              disabled={!canNext[step]}
            >
              <Text style={styles.primaryBtnText}>Continue</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color="#0A0A0A" />
                : <Text style={styles.primaryBtnText}>Publish Event</Text>
              }
            </Pressable>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── STEP 0 ───────────────────────────────────────────────────────────────────

function Step0({ data, set, pickImage }: {
  data: WizardData;
  set: (k: keyof WizardData, v: any) => void;
  pickImage: () => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Tell us about{"\n"}your event.</Text>
      <Text style={styles.stepSub}>Start with the basics — name, description, and a cover photo.</Text>

      {/* Banner */}
      {data.banner ? (
        <View style={styles.bannerPickerFilled}>
          <BannerPreview
            uri={data.banner.uri}
            offset={data.bannerPosition}
            onOffsetChange={(o) => set("bannerPosition", o)}
          />
          <Pressable onPress={pickImage} style={styles.changeBannerBtn}>
            <Text style={styles.changeBannerText}>Change photo</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.bannerPickerEmpty} onPress={pickImage}>
          <Text style={styles.bannerEmptyIcon}>📷</Text>
          <Text style={styles.bannerEmptyText}>Add cover photo</Text>
          <Text style={styles.bannerEmptyHint}>Full width · drag to reposition after upload</Text>
        </Pressable>
      )}

      <Field label="Event name" required>
        <TextInput
          style={styles.input}
          placeholder="e.g. Groove Beats Day Fest"
          placeholderTextColor={colors.textTertiary}
          value={data.title}
          onChangeText={(v) => set("title", v)}
        />
      </Field>

      <Field label="Description">
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="What's this event about? What should attendees expect?"
          placeholderTextColor={colors.textTertiary}
          value={data.description}
          onChangeText={(v) => set("description", v)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </Field>

      <Field label="Category">
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.value}
              style={[
                styles.categoryChip,
                data.category === cat.value && styles.categoryChipActive,
              ]}
              onPress={() => set("category", cat.value)}
            >
              <Text style={[
                styles.categoryChipText,
                data.category === cat.value && styles.categoryChipTextActive,
              ]}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Field>
    </View>
  );
}

// ─── STEP 1 ───────────────────────────────────────────────────────────────────

function Step1({ data, set, showDatePicker, setShowDatePicker, showTimePicker, setShowTimePicker }: {
  data: WizardData;
  set: (k: keyof WizardData, v: any) => void;
  showDatePicker: boolean;
  setShowDatePicker: (v: boolean) => void;
  showTimePicker: boolean;
  setShowTimePicker: (v: boolean) => void;
}) {
  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>When and{"\n"}where?</Text>
      <Text style={styles.stepSub}>Set the date, time, and venue for your event.</Text>

      <Field label="Date" required>
        <Pressable style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.inputText}>{formatDate(data.date)}</Text>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={data.date}
            mode="date"
            minimumDate={new Date()}
            onChange={(_, selected) => {
              setShowDatePicker(false);
              if (selected) {
                const merged = new Date(data.date);
                merged.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
                set("date", merged);
              }
            }}
          />
        )}
      </Field>

      <Field label="Time" required>
        <Pressable style={styles.input} onPress={() => setShowTimePicker(true)}>
          <Text style={styles.inputText}>{formatTime(data.date)}</Text>
        </Pressable>
        {showTimePicker && (
          <DateTimePicker
            value={data.date}
            mode="time"
            onChange={(_, selected) => {
              setShowTimePicker(false);
              if (selected) {
                const merged = new Date(data.date);
                merged.setHours(selected.getHours(), selected.getMinutes());
                set("date", merged);
              }
            }}
          />
        )}
      </Field>

      <Field label="Venue" required>
        <TextInput
          style={styles.input}
          placeholder="e.g. Jabi Lake Park, Abuja"
          placeholderTextColor={colors.textTertiary}
          value={data.venue}
          onChangeText={(v) => set("venue", v)}
        />
      </Field>
    </View>
  );
}

// ─── STEP 2 ───────────────────────────────────────────────────────────────────

function Step2({ data, set }: {
  data: WizardData;
  set: (k: keyof WizardData, v: any) => void;
}) {
  const { isPaid } = data;
  const price = parsePaidPriceAmount(data.price);
  const tickets = parseInt(data.ticketsAvailable || "0", 10) || 0;
  const serviceFee = 150;
  const totalPerTicket = isPaid ? price + serviceFee : 0;

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Tickets{"\n"}& pricing.</Text>
      <Text style={styles.stepSub}>Set your ticket price and how many are available.</Text>

      <View style={styles.toggleRow}>
        {(["Free", "Paid"] as const).map((label) => {
          const isActive = label === "Paid" ? isPaid : !isPaid;
          return (
            <Pressable
              key={label}
              style={[styles.toggleBtn, isActive && styles.toggleBtnActive]}
              onPress={() => {
                if (label === "Free") { set("isPaid", false); set("price", ""); }
                else { set("isPaid", true); if (!isPaid || !data.price || data.price === "0") set("price", ""); }
              }}
            >
              <Text style={[styles.toggleBtnText, isActive && styles.toggleBtnTextActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isPaid && (
        <Field label="Ticket price (₦)" required>
          <TextInput
            style={styles.input}
            placeholder="e.g. 5000"
            placeholderTextColor={colors.textTertiary}
            value={data.price}
            onChangeText={(v) => set("price", sanitizePaidPrice(v))}
            keyboardType="numeric"
          />
        </Field>
      )}

      <Field label="Total tickets available">
        <TextInput
          style={styles.input}
          placeholder="e.g. 200"
          placeholderTextColor={colors.textTertiary}
          value={data.ticketsAvailable}
          onChangeText={(v) => set("ticketsAvailable", v.replace(/[^0-9]/g, ""))}
          keyboardType="numeric"
        />
      </Field>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Event summary</Text>
        <SummaryRow
          label="Ticket price"
          value={!isPaid ? "Free" : price > 0 ? `₦${price.toLocaleString()}` : "—"}
        />
        {isPaid && price > 0 && (
          <SummaryRow label="Service fee (attendee pays)" value={`₦${serviceFee}`} />
        )}
        {isPaid && price > 0 && (
          <SummaryRow label="Attendee pays" value={`₦${totalPerTicket.toLocaleString()}`} bold />
        )}
        {tickets > 0 && (
          <SummaryRow label="Capacity" value={`${tickets.toLocaleString()} tickets`} />
        )}
        {tickets > 0 && isPaid && price > 0 && (
          <SummaryRow
            label="Max gross revenue"
            value={`₦${(price * tickets).toLocaleString()}`}
            accent
          />
        )}
      </View>
    </View>
  );
}

function SummaryRow({ label, value, bold, accent }: {
  label: string; value: string; bold?: boolean; accent?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[
        styles.summaryValue,
        bold && styles.summaryValueBold,
        accent && styles.summaryValueAccent,
      ]}>{value}</Text>
    </View>
  );
}

// ─── EDIT SCREEN ─────────────────────────────────────────────────────────────

type EditData = {
  title: string;
  description: string;
  category: string;
  date: Date;
  venue: string;
  isPaid: boolean;
  price: string;
  ticketsAvailable: string;
  banner: { uri: string; name: string; type: string } | null;
  bannerPosition: BannerOffset;
  existingBanner: string | null;
};

function EditScreen({ eventId }: { eventId: string }) {
  const token = useAuthStore((s) => s.token);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [data, setData] = useState<EditData>({
    title: "", description: "", category: "general", date: new Date(),
    venue: "", isPaid: false, price: "", ticketsAvailable: "",
    banner: null, bannerPosition: { ...DEFAULT_BANNER_POSITION }, existingBanner: null,
  });

  const set = (key: keyof EditData, val: any) =>
    setData((d) => ({ ...d, [key]: val }));

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/events/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const event = await res.json();
        const isPaid = deriveIsPaidFromEventPrice(event.price);
        setData({
          title: event.title ?? "",
          description: event.description ?? "",
          category: event.category ?? "general",
          date: event.date ? new Date(event.date) : new Date(),
          venue: event.venue ?? "",
          isPaid,
          price: isPaid ? String(event.price) : "",
          ticketsAvailable: event.ticketsAvailable?.toString() ?? "",
          banner: null,
          bannerPosition: parseBannerPosition(event.bannerPosition),
          existingBanner: event.banner ?? null,
        });
      } catch {
        Alert.alert("Error", "Could not load event details");
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const ext = asset.uri.split(".").pop() ?? "jpg";
      setData((d) => ({
        ...d,
        bannerPosition: { ...DEFAULT_BANNER_POSITION },
        banner: { uri: asset.uri, name: `banner.${ext}`, type: `image/${ext}` },
      }));
    }
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("title", data.title.trim());
      form.append("description", data.description.trim());
      form.append("category", data.category);
      form.append("date", data.date.toISOString());
      form.append("venue", data.venue.trim());
      form.append("price", resolveSubmitPrice(data.isPaid, data.price));
      form.append("ticketsAvailable", data.ticketsAvailable || "0");
      appendBannerPosition(form, data.bannerPosition);
      if (data.banner) form.append("banner", data.banner as any);

      const res = await fetch(`${BASE_URL}/api/events/${eventId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (res.ok) {
        Alert.alert("Saved", "Event updated successfully.", [
          { text: "Done", onPress: () => router.back() },
        ]);
      } else {
        const err = await res.json();
        Alert.alert("Error", err.message ?? "Failed to update event");
      }
    } catch {
      Alert.alert("Error", "Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const bannerUri = data.banner?.uri ?? data.existingBanner ?? null;
  const { isPaid } = data;
  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <View style={styles.editHeader}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
          <Text style={styles.editHeaderTitle}>Edit Event</Text>
          <Pressable
            style={[styles.saveHeaderBtn, submitting && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color={colors.accent} size="small" />
              : <Text style={styles.saveHeaderBtnText}>Save</Text>
            }
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.editContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Banner card */}
          <EditCard
            title="Cover Photo"
            subtitle={bannerUri ? "Tap to reposition or change" : "Add a cover photo"}
            active={activeCard === "banner"}
            onPress={() => setActiveCard(activeCard === "banner" ? null : "banner")}
          >
            {activeCard === "banner" && (
              <View style={styles.editCardBody}>
                {bannerUri && (
                  <View style={styles.editBannerFrame}>
                    <BannerPreview
                      uri={bannerUri}
                      offset={data.bannerPosition}
                      onOffsetChange={(o) => set("bannerPosition", o)}
                      height={140}
                    />
                  </View>
                )}
                <Pressable style={styles.outlineBtn} onPress={pickImage}>
                  <Text style={styles.outlineBtnText}>
                    {bannerUri ? "Change photo" : "Choose photo"}
                  </Text>
                </Pressable>
              </View>
            )}
          </EditCard>

          <EditCard
            title="Name & Description"
            subtitle={data.title || "Not set"}
            active={activeCard === "details"}
            onPress={() => setActiveCard(activeCard === "details" ? null : "details")}
          >
            {activeCard === "details" && (
              <View style={styles.editCardBody}>
                <Text style={styles.editFieldLabel}>Event name</Text>
                <TextInput
                  style={styles.editInput}
                  value={data.title}
                  onChangeText={(v) => set("title", v)}
                  placeholder="Event name"
                  placeholderTextColor={colors.textTertiary}
                />
                <Text style={[styles.editFieldLabel, { marginTop: 14 }]}>Description</Text>
                <TextInput
                  style={[styles.editInput, styles.editTextarea]}
                  value={data.description}
                  onChangeText={(v) => set("description", v)}
                  placeholder="Describe your event"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            )}
          </EditCard>

          <EditCard
            title="Category"
            subtitle={CATEGORIES.find((c) => c.value === data.category)?.label ?? "General"}
            active={activeCard === "category"}
            onPress={() => setActiveCard(activeCard === "category" ? null : "category")}
          >
            {activeCard === "category" && (
              <View style={[styles.editCardBody, { paddingBottom: 4 }]}>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat.value}
                      style={[
                        styles.categoryChip,
                        data.category === cat.value && styles.categoryChipActive,
                      ]}
                      onPress={() => { set("category", cat.value); setActiveCard(null); }}
                    >
                      <Text style={[
                        styles.categoryChipText,
                        data.category === cat.value && styles.categoryChipTextActive,
                      ]}>
                        {cat.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </EditCard>

          <EditCard
            title="Date & Time"
            subtitle={`${formatDate(data.date)} at ${formatTime(data.date)}`}
            active={activeCard === "datetime"}
            onPress={() => setActiveCard(activeCard === "datetime" ? null : "datetime")}
          >
            {activeCard === "datetime" && (
              <View style={styles.editCardBody}>
                <Text style={styles.editFieldLabel}>Date</Text>
                <Pressable style={styles.editInput} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.inputText}>{formatDate(data.date)}</Text>
                </Pressable>
                {showDatePicker && (
                  <DateTimePicker
                    value={data.date}
                    mode="date"
                    minimumDate={new Date()}
                    onChange={(_, selected) => {
                      setShowDatePicker(false);
                      if (selected) {
                        const merged = new Date(data.date);
                        merged.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
                        set("date", merged);
                      }
                    }}
                  />
                )}
                <Text style={[styles.editFieldLabel, { marginTop: 14 }]}>Time</Text>
                <Pressable style={styles.editInput} onPress={() => setShowTimePicker(true)}>
                  <Text style={styles.inputText}>{formatTime(data.date)}</Text>
                </Pressable>
                {showTimePicker && (
                  <DateTimePicker
                    value={data.date}
                    mode="time"
                    onChange={(_, selected) => {
                      setShowTimePicker(false);
                      if (selected) {
                        const merged = new Date(data.date);
                        merged.setHours(selected.getHours(), selected.getMinutes());
                        set("date", merged);
                      }
                    }}
                  />
                )}
              </View>
            )}
          </EditCard>

          <EditCard
            title="Venue"
            subtitle={data.venue || "Not set"}
            active={activeCard === "venue"}
            onPress={() => setActiveCard(activeCard === "venue" ? null : "venue")}
          >
            {activeCard === "venue" && (
              <View style={styles.editCardBody}>
                <TextInput
                  style={styles.editInput}
                  value={data.venue}
                  onChangeText={(v) => set("venue", v)}
                  placeholder="e.g. Jabi Lake Park, Abuja"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            )}
          </EditCard>

          <EditCard
            title="Tickets & Pricing"
            subtitle={!isPaid ? "Free event" : `₦${parsePaidPriceAmount(data.price).toLocaleString()} per ticket`}
            active={activeCard === "tickets"}
            onPress={() => setActiveCard(activeCard === "tickets" ? null : "tickets")}
          >
            {activeCard === "tickets" && (
              <View style={styles.editCardBody}>
                <View style={styles.toggleRow}>
                  {(["Free", "Paid"] as const).map((label) => {
                    const isActive = label === "Paid" ? isPaid : !isPaid;
                    return (
                      <Pressable
                        key={label}
                        style={[styles.toggleBtn, isActive && styles.toggleBtnActive]}
                        onPress={() => {
                          if (label === "Free") { set("isPaid", false); set("price", ""); }
                          else { set("isPaid", true); if (!isPaid || !data.price || data.price === "0") set("price", ""); }
                        }}
                      >
                        <Text style={[styles.toggleBtnText, isActive && styles.toggleBtnTextActive]}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {isPaid && (
                  <>
                    <Text style={[styles.editFieldLabel, { marginTop: 14 }]}>Price (₦)</Text>
                    <TextInput
                      style={styles.editInput}
                      value={data.price}
                      onChangeText={(v) => set("price", sanitizePaidPrice(v))}
                      placeholder="e.g. 5000"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="numeric"
                    />
                  </>
                )}
                <Text style={[styles.editFieldLabel, { marginTop: 14 }]}>Tickets available</Text>
                <TextInput
                  style={styles.editInput}
                  value={data.ticketsAvailable}
                  onChangeText={(v) => set("ticketsAvailable", v.replace(/[^0-9]/g, ""))}
                  placeholder="e.g. 200"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
            )}
          </EditCard>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function EditCard({ title, subtitle, active, onPress, children }: {
  title: string;
  subtitle: string;
  active: boolean;
  onPress: () => void;
  children?: React.ReactNode;
}) {
  return (
    <View style={[styles.editCard, active && styles.editCardActive]}>
      <Pressable style={styles.editCardHeader} onPress={onPress}>
        <View style={{ flex: 1 }}>
          <Text style={styles.editCardTitle}>{title}</Text>
          {!active && (
            <Text style={styles.editCardSubtitle} numberOfLines={1}>{subtitle}</Text>
          )}
        </View>
        <Text style={[styles.editCardChevron, active && styles.editCardChevronActive]}>›</Text>
      </Pressable>
      {children}
    </View>
  );
}

function Field({ label, required, children }: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}{required && <Text style={styles.fieldRequired}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pageBg },
  center:    { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.pageBg },

  // Wizard header
  wizardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.pageBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stepIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepIndicatorItem: {
    alignItems: "center",
    gap: 3,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surface2,
  },
  stepDotActive: {
    backgroundColor: colors.accent,
    width: 18,
    height: 6,
    borderRadius: 3,
  },
  stepDotDone: {
    backgroundColor: colors.accent,
    opacity: 0.35,
  },
  stepLabel: {
    fontFamily: fonts.dmSans,
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: 0.2,
  },
  stepLabelActive: {
    color: colors.accent,
    fontFamily: fonts.dmSansMedium,
  },

  wizardContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  wizardFooter: {
    padding: 20,
    paddingBottom: 36,
    backgroundColor: colors.pageBg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  ctaHint: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: "center",
  },

  // Edit header
  editHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.pageBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  editHeaderTitle: {
    fontFamily: fonts.frauncesBold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  saveHeaderBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  saveHeaderBtnText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 13,
    color: colors.accent,
  },

  editContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },

  // Edit cards
  editCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  editCardActive: {
    borderColor: colors.accent,
    borderWidth: 1.5,
  },
  editCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
  },
  editCardTitle: {
    fontFamily: fonts.dmSansBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  editCardSubtitle: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  editCardChevron: {
    fontSize: 22,
    color: colors.textTertiary,
  },
  editCardChevronActive: {
    color: colors.accent,
  },
  editCardBody: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },

  editBannerFrame: {
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },

  editFieldLabel: {
    fontFamily: fonts.dmSans,
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  editInput: {
    backgroundColor: colors.surface2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fonts.dmSansMedium,
    fontSize: 15,
    color: colors.textPrimary,
    justifyContent: "center",
  },
  editTextarea: {
    minHeight: 90,
    paddingTop: 12,
  },

  outlineBtn: {
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: "center",
  },
  outlineBtnText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 13,
    color: colors.accent,
  },

  // Wizard steps
  stepContainer: {
    paddingTop: 28,
    gap: 26,
  },
  stepTitle: {
    fontFamily: fonts.frauncesBlack,
    fontSize: 34,
    color: colors.textPrimary,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  stepSub: {
    fontFamily: fonts.dmSans,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: -12,
  },

  // Fields
  field: { gap: 8 },
  fieldLabel: {
    fontFamily: fonts.dmSans,
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  fieldRequired: { color: colors.accent },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 15,
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
  textarea: {
    minHeight: 100,
    paddingTop: 14,
    textAlignVertical: "top",
  },

  // Banner
  bannerPickerEmpty: {
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: colors.surface,
    height: BANNER_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  bannerPickerFilled: {
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  bannerFrame: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: colors.surface2,
  },
  bannerImagePositioned: {
    width: "100%",
    height: "100%",
  },
  bannerDragHint: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  bannerDragHintText: {
    fontFamily: fonts.dmSansMedium,
    fontSize: 11,
    color: "#F0F0F0",
  },
  bannerEmptyIcon: { fontSize: 28 },
  bannerEmptyText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  bannerEmptyHint: {
    fontFamily: fonts.dmSans,
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  changeBannerBtn: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  changeBannerText: {
    fontFamily: fonts.dmSans,
    fontSize: 12,
    color: colors.accent,
    textDecorationLine: "underline",
  },

  // Category chips
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  categoryChipActive: {
    backgroundColor: "rgba(202,255,0,0.1)",
    borderColor: "rgba(202,255,0,0.3)",
  },
  categoryChipText: {
    fontFamily: fonts.dmSansMedium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: colors.accent,
    fontFamily: fonts.dmSansBold,
  },

  // Toggle
  toggleRow: {
    flexDirection: "row",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    backgroundColor: colors.surface2,
    padding: 3,
    gap: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 11,
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "transparent",
  },
  toggleBtnActive: {
    backgroundColor: colors.accent,
  },
  toggleBtnText: {
    fontFamily: fonts.dmSansMedium,
    fontSize: 13,
    color: colors.textTertiary,
  },
  toggleBtnTextActive: {
    color: "#0A0A0A",
    fontFamily: fonts.dmSansBold,
  },

  // Summary card
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  summaryTitle: {
    fontFamily: fonts.frauncesBold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontFamily: fonts.dmSans,
    fontSize: 13,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontFamily: fonts.dmSansMedium,
    fontSize: 13,
    color: colors.textPrimary,
  },
  summaryValueBold: { fontFamily: fonts.dmSansBold },
  summaryValueAccent: {
    fontFamily: fonts.dmSansBold,
    color: colors.accent,
  },

  // Primary button
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 16,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 15,
    color: "#0A0A0A",
    letterSpacing: 0.2,
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
  backArrow: {
    fontSize: 18,
    color: colors.textPrimary,
  },
});