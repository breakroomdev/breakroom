import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function relativeTime(date: Date | number): string {
  const then = typeof date === "number" ? date : date.getTime();
  const diffSec = Math.round((Date.now() - then) / 1000);

  const units: [number, string][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.345, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];

  let value = diffSec;
  let unit = "second";
  for (const [amount, name] of units) {
    if (Math.abs(value) < amount) {
      unit = name;
      break;
    }
    value = Math.round(value / amount);
    unit = name;
  }

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  return rtf.format(-value, unit as Intl.RelativeTimeFormatUnit);
}

export function formatDate(date: Date | string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", opts).format(d);
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(h ?? 0, m ?? 0);
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
