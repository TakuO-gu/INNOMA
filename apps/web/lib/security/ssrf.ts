/**
 * SSRF protections for external fetches.
 */

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { isOfficialDomain } from "@/lib/llm/google-search";

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) {
    return false;
  }
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 0) return true;
  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // fc00::/7
  if (normalized.startsWith("fe80")) return true; // fe80::/10
  return false;
}

function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 4) return isPrivateIpv4(ip);
  if (isIP(ip) === 6) return isPrivateIpv6(ip);
  return false;
}

function normalizeDomainList(domains: string[]): string[] {
  return domains
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowedDomain(hostname: string, allowedDomains: string[]): boolean {
  if (allowedDomains.length === 0) return false;
  return allowedDomains.some((domain) => {
    if (hostname === domain) return true;
    return hostname.endsWith(`.${domain}`);
  });
}

export async function validateExternalUrl(
  url: string,
  options?: { allowedDomains?: string[] }
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "Invalid URL" };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { ok: false, error: "Only http/https URLs are allowed" };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!hostname) {
    return { ok: false, error: "Invalid hostname" };
  }

  // Block IP literals and private ranges
  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      return { ok: false, error: "Private IP addresses are not allowed" };
    }
  } else {
    try {
      const records = await lookup(hostname, { all: true });
      for (const record of records) {
        if (isPrivateIp(record.address)) {
          return { ok: false, error: "Private network targets are not allowed" };
        }
      }
    } catch {
      return { ok: false, error: "Failed to resolve hostname" };
    }
  }

  const allowedDomains = normalizeDomainList(options?.allowedDomains ?? []);
  if (!isOfficialDomain(parsed.toString()) && !isAllowedDomain(hostname, allowedDomains)) {
    return { ok: false, error: "URL domain is not allowed" };
  }

  return { ok: true, url: parsed.toString() };
}
