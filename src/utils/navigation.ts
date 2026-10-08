import { router, type Href } from "expo-router";

/** Prefer history back; if none (redirect / deep link), replace to fallback. */
export function safeBack(fallbackRoute: Href) {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallbackRoute);
  }
}
