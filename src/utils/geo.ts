import { RemoteMachine } from "../types";

export interface GeoLocation {
  city: string;
  country: string;
  lat: number;
  lng: number;
  isCustom?: boolean;
}

const GLOBAL_PRESETS = [
  { city: "San Francisco", country: "United States of America", lat: 37.7749, lng: -122.4194 },
  { city: "London", country: "United Kingdom", lat: 51.5074, lng: -0.1278 },
  { city: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
  { city: "Frankfurt", country: "Germany", lat: 50.1109, lng: 8.6821 },
  { city: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
  { city: "São Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333 },
  { city: "Mumbai", country: "India", lat: 19.0760, lng: 72.8777 },
  { city: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198 },
  { city: "Cape Town", country: "South Africa", lat: -33.9249, lng: 18.4241 },
  { city: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832 }
];

export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

// Check if IP is private
export function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  const parts = ip.split(".");
  if (parts.length !== 4) return true;
  
  const first = parseInt(parts[0]);
  const second = parseInt(parts[1]);
  
  // 127.0.0.1 (Loopback)
  if (first === 127) return true;
  // 10.0.0.0 - 10.255.255.255
  if (first === 10) return true;
  // 172.16.0.0 - 172.31.255.255
  if (first === 172 && (second >= 16 && second <= 31)) return true;
  // 192.168.0.0 - 192.168.255.255
  if (first === 192 && second === 168) return true;
  // localhost or other local words
  if (ip.toLowerCase() === "localhost") return true;

  return false;
}

// Get fallback deterministic location
export function getFallbackLocation(ip: string, name?: string): GeoLocation {
  const cleanIp = ip.trim();
  
  // Hardcoded match for initial ubuntu-prod-app-01 GCP IP for visual accuracy
  if (cleanIp === "104.198.14.88") {
    return {
      city: "Council Bluffs",
      country: "United States of America",
      lat: 41.2619,
      lng: -95.8608
    };
  }

  // Use hash of IP / Name to deterministically spread private or other IPs
  const seed = hashString(cleanIp + (name || ""));
  const index = seed % GLOBAL_PRESETS.length;
  
  return { ...GLOBAL_PRESETS[index] };
}

// Asynchronously resolve IP metadata with caching
export async function fetchGeoForIp(ip: string, name?: string): Promise<GeoLocation> {
  const cleanIp = ip.trim();
  
  if (isPrivateIp(cleanIp)) {
    return getFallbackLocation(cleanIp, name);
  }

  const cacheKey = `geo_cache_${cleanIp}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.warn("Storage cache read failed:", e);
  }

  // Attempt to fetch from free API with a timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    // We can use freeipapi.com as it supports CORS and has no auth limits
    const response = await fetch(`https://freeipapi.com/api/json/${cleanIp}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && typeof data.latitude === "number" && typeof data.longitude === "number") {
        const result: GeoLocation = {
          city: data.cityName || "Unknown City",
          country: data.countryName || "Unknown Country",
          lat: data.latitude,
          lng: data.longitude
        };
        
        try {
          localStorage.setItem(cacheKey, JSON.stringify(result));
        } catch (e) {
          console.warn("Saving geolocation cache failed:", e);
        }
        
        return result;
      }
    }
  } catch (err) {
    console.warn(`Geo IP resolution failed for ${cleanIp}, falling back deterministically:`, err);
  }

  return getFallbackLocation(cleanIp, name);
}
