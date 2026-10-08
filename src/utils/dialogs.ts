import { Alert, Platform } from "react-native";

function formatDialogText(title: string, message: string) {
  return message ? `${title}\n\n${message}` : title;
}

/** Cross-platform message dialog. Native OK (or web alert) then optional onDone. */
export function showMessage(
  title: string,
  message: string,
  onDone?: () => void
) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      window.alert(formatDialogText(title, message));
    }
    onDone?.();
    return;
  }

  Alert.alert(title, message, [
    { text: "OK", onPress: () => onDone?.() },
  ]);
}

/** Cross-platform confirm. Calls onConfirm only when the user confirms. */
export function confirmAction(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void,
  destructive?: boolean
) {
  if (Platform.OS === "web") {
    if (
      typeof window !== "undefined" &&
      window.confirm(formatDialogText(title, message))
    ) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    {
      text: confirmLabel,
      style: destructive ? "destructive" : "default",
      onPress: onConfirm,
    },
  ]);
}
