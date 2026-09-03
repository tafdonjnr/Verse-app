import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { CameraView, Camera } from "expo-camera";
import { router } from "expo-router";
import { colors, fonts, radius } from "@/src/theme";
import { useAuthStore } from "@/src/store/auth-store";

const BASE_URL = "https://eventapp-ju5c.onrender.com";

type ScanState = "idle" | "scanning" | "success" | "error" | "used";

export default function ScannerScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanMessage, setScanMessage] = useState("");
  const [attendeeName, setAttendeeName] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [processing, setProcessing] = useState(false);
  const lastScanned = useRef<string | null>(null);
  const cooldown = useRef(false);

  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(({ status }) => {
      setHasPermission(status === "granted");
    });
  }, []);

  const handleScan = async ({ data }: { data: string }) => {
    if (cooldown.current || processing || data === lastScanned.current) return;

    cooldown.current = true;
    lastScanned.current = data;
    setProcessing(true);

    try {
      let parsed: any;
      try {
        parsed = JSON.parse(data);
      } catch {
        setScanState("error");
        setScanMessage("Invalid QR code");
        resetAfterDelay();
        return;
      }

      const { ticketId } = parsed;

      if (!ticketId) {
        setScanState("error");
        setScanMessage("Invalid ticket format");
        resetAfterDelay();
        return;
      }

      const res = await fetch(`${BASE_URL}/api/tickets/${ticketId}/use`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const responseData = await res.json();

      if (res.ok) {
        setScanState("success");
        setScanMessage("Ticket verified successfully");
        setAttendeeName(parsed.attendeeId ?? "");
        setEventTitle(parsed.eventId ?? "");
      } else if (res.status === 400 && responseData.message?.includes("already used")) {
        setScanState("used");
        setScanMessage("This ticket has already been used");
      } else {
        setScanState("error");
        setScanMessage(responseData.message ?? "Invalid ticket");
      }
    } catch (err) {
      setScanState("error");
      setScanMessage("Connection error — try again");
    } finally {
      setProcessing(false);
      resetAfterDelay();
    }
  };

  const resetAfterDelay = () => {
    setTimeout(() => {
      setScanState("idle");
      setScanMessage("");
      setAttendeeName("");
      setEventTitle("");
      cooldown.current = false;
      lastScanned.current = null;
    }, 3000);
  };

  const handleReset = () => {
    setScanState("idle");
    setScanMessage("");
    cooldown.current = false;
    lastScanned.current = null;
  };

  // Start scanning — transition idle → scanning
  const handleStartScan = () => {
    setScanState("scanning");
  };

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>Camera access required</Text>
        <Pressable
          style={styles.permissionBtn}
          onPress={() => Camera.requestCameraPermissionsAsync()}
        >
          <Text style={styles.permissionBtnText}>Grant Access</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera — only actively scanning when scanState === "scanning" */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanState === "scanning" ? handleScan : undefined}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      {/* Dark overlay with viewfinder cutout */}
      <View style={styles.overlay}>
        {/* Top dark */}
        <View style={styles.overlayTop}>
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backArrow}>←</Text>
            </Pressable>
            <Text style={styles.headerTitle}>Scan Ticket</Text>
            <View style={{ width: 36 }} />
          </View>
        </View>

        {/* Middle row — sides dark, center clear */}
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />

          {/* Viewfinder */}
          <View style={styles.viewfinder}>
            {/* Corner marks — green when scanning, white otherwise */}
            {(["TL", "TR", "BL", "BR"] as const).map((pos) => (
              <View
                key={pos}
                style={[
                  styles.corner,
                  styles[`corner${pos}`],
                  { borderColor: scanState === "scanning" ? colors.accent : "#fff" },
                ]}
              />
            ))}

            {/* Scan line — only when actively scanning */}
            {scanState === "scanning" && (
              <View style={styles.scanLine} />
            )}

            {/* State overlay inside viewfinder */}
            {(scanState === "success" || scanState === "used" || scanState === "error") && (
              <View style={[
                styles.stateOverlay,
                scanState === "success" && styles.stateOverlaySuccess,
                scanState === "used" && styles.stateOverlayUsed,
                scanState === "error" && styles.stateOverlayError,
              ]}>
                <Text style={styles.stateIcon}>
                  {scanState === "success" ? "✓" : scanState === "used" ? "⚠" : "✗"}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.overlaySide} />
        </View>

        {/* Bottom dark */}
        <View style={styles.overlayBottom}>
          {processing && (
            <ActivityIndicator color="#fff" style={{ marginBottom: 12 }} />
          )}

          {/* IDLE — show Scan Ticket button */}
          {scanState === "idle" && !processing && (
            <>
              <Text style={styles.hint}>
                Point camera at the QR code on the ticket
              </Text>
              <Pressable style={styles.scanBtn} onPress={handleStartScan}>
                <Text style={styles.scanBtnText}>Scan Ticket</Text>
              </Pressable>
            </>
          )}

          {/* SCANNING — show Cancel button */}
          {scanState === "scanning" && !processing && (
            <>
              <Text style={styles.hint}>Scanning…</Text>
              <Pressable style={styles.cancelBtn} onPress={handleReset}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            </>
          )}

          {scanState === "success" && (
            <View style={styles.resultCard}>
              <Text style={styles.resultIcon}>✓</Text>
              <Text style={styles.resultTitle}>Check-in Successful</Text>
              <Text style={styles.resultSub}>{scanMessage}</Text>
            </View>
          )}

          {scanState === "used" && (
            <View style={[styles.resultCard, styles.resultCardUsed]}>
              <Text style={styles.resultIcon}>⚠</Text>
              <Text style={styles.resultTitle}>Already Used</Text>
              <Text style={styles.resultSub}>{scanMessage}</Text>
            </View>
          )}

          {scanState === "error" && (
            <View style={[styles.resultCard, styles.resultCardError]}>
              <Text style={styles.resultIcon}>✗</Text>
              <Text style={styles.resultTitle}>Invalid Ticket</Text>
              <Text style={styles.resultSub}>{scanMessage}</Text>
              <Pressable style={styles.retryBtn} onPress={handleReset}>
                <Text style={styles.retryBtnText}>Try Again</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const VIEWFINDER_SIZE = 260;
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#000" },
  center: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  permissionText: {
    fontFamily: fonts.dmSans,
    fontSize: 16,
    color: "#fff",
  },
  permissionBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.lg,
  },
  permissionBtnText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 14,
    color: "#0A0A0A",  
  },

  overlay:      { flex: 1 },

  overlayTop: {
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow:    { fontSize: 18, color: "#fff" },
  headerTitle: {
    fontFamily: fonts.frauncesBold,
    fontSize: 18,
    color: "#fff",
  },

  overlayMiddle: {
    flexDirection: "row",
    height: VIEWFINDER_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
  },

  viewfinder: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
    position: "relative",
  },

  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },

  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    height: 2,
    backgroundColor: colors.accent,
    opacity: 0.8,
  },

  stateOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  stateOverlaySuccess: { backgroundColor: "rgba(22,163,74,0.7)" },
  stateOverlayUsed:    { backgroundColor: "rgba(217,119,6,0.7)" },
  stateOverlayError:   { backgroundColor: "rgba(190,18,60,0.7)" },
  stateIcon: {
    fontSize: 64,
    color: "#fff",
  },

  overlayBottom: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    paddingTop: 32,
    paddingHorizontal: 24,
    gap: 16,
  },
  hint: {
    fontFamily: fonts.dmSans,
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },

  // Intentional scan button
  scanBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: radius.xl,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  scanBtnText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 15,
    color: "#0A0A0A",  
    letterSpacing: 0.3,
  },

  // Cancel button while scanning
  cancelBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: radius.xl,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
  },

  resultCard: {
    alignItems: "center",
    gap: 8,
    padding: 20,
    borderRadius: radius.xl,
    backgroundColor: "rgba(22,163,74,0.2)",
    borderWidth: 1,
    borderColor: "rgba(22,163,74,0.4)",
    width: "100%",
  },
  resultCardUsed: {
    backgroundColor: "rgba(217,119,6,0.2)",
    borderColor: "rgba(217,119,6,0.4)",
  },
  resultCardError: {
    backgroundColor: "rgba(190,18,60,0.2)",
    borderColor: "rgba(190,18,60,0.4)",
  },
  resultIcon:   { fontSize: 32 },
  resultTitle: {
    fontFamily: fonts.frauncesBold,
    fontSize: 18,
    color: "#fff",
  },
  resultSub: {
    fontFamily: fonts.dmSans,
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  retryBtnText: {
    fontFamily: fonts.dmSansBold,
    fontSize: 13,
    color: "#fff",
  },
});