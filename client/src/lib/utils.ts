import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function fetchFromGoogleViaServer(params: {
  host: string;
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
}) {
  const url = new URL(`/api/google/proxy`, window.location.origin);
  url.searchParams.set("host", params.host);
  url.searchParams.set("path", params.path);
  if (params.query) {
    Object.entries(params.query).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
  }
  const res = await fetch(url.toString(), { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Google proxy error: ${res.status}`);
  return res.json();
}
