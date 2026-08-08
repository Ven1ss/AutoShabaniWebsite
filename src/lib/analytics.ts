export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window === "undefined") return;
  const gtag = (
    window as unknown as {
      gtag?: (...args: unknown[]) => void;
    }
  ).gtag;
  gtag?.("event", name, params);
}
