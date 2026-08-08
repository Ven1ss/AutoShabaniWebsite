import { cookies } from "next/headers";
import {
  defaultLocale,
  type Locale,
  isLocale,
  LOCALE_COOKIE,
} from "@/lib/translations";

export async function getServerLocale(): Promise<Locale> {
  try {
    const jar = await cookies();
    const value = jar.get(LOCALE_COOKIE)?.value;
    if (value && isLocale(value)) return value;
  } catch {
    /* cookies() unavailable outside request */
  }
  return defaultLocale;
}
