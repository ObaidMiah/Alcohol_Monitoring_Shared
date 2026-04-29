import type {
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  GeoJSONLineString,
  GeoJSONPoint,
  Reading,
  ReadingPointProperties,
  Role,
} from "../types";
import { canViewBAC, getReadingResult } from "./compliance";

// ── Reading result display config ───────────────────────────────

export const READING_RESULT_CONFIG = {
  compliant: {
    label: "Compliant",
    shortLabel: "✓ Compliant",
    color: "#1D9E75",
    bgColor: "#E1F5EE",
    textColor: "#085041",
  },
  non_compliant: {
    label: "Non-compliant",
    shortLabel: "✗ Non-compliant",
    color: "#E05A38",
    bgColor: "#FAECE7",
    textColor: "#712B13",
  },
  missed: {
    label: "Missed reading",
    shortLabel: "— Missed",
    color: "#888780",
    bgColor: "#F1EFE8",
    textColor: "#444441",
  },
} as const;

export type ReadingResultKey = keyof typeof READING_RESULT_CONFIG;

function hasValidGps(
  reading: Reading,
): reading is Reading & { gpsLat: number; gpsLng: number } {
  return (
    reading.gpsLat != null &&
    reading.gpsLng != null &&
    reading.gpsFixStatus === "acquired"
  );
}

export function readingsToGeoJSON(
  readings: Reading[],
  role: Role,
): GeoJSONFeatureCollection<GeoJSONPoint, ReadingPointProperties> {
  const showBac = canViewBAC(role);

  const features = readings
    .filter(hasValidGps)
    .map((reading): GeoJSONFeature<GeoJSONPoint, ReadingPointProperties> => {
      const properties: ReadingPointProperties = {
        recordedAt: reading.recordedAt,
        result: getReadingResult(reading),
        batteryPercent: reading.batteryPercent,
        wristOn: reading.wristOn,
        gpsAccuracyM: reading.gpsAccuracyM,
        transmissionPath: reading.transmissionPath,
        ...(showBac ? { bac: reading.bac } : {}),
      };

      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [reading.gpsLng, reading.gpsLat],
        },
        properties,
      };
    });

  return { type: "FeatureCollection", features };
}

// ── Trail stats ────────────────────────────────────────────────

export interface TrailStats {
  totalReadings: number;
  validGPSReadings: number;
  gpsFailed: number;
  distanceKm: number | null;
}

export function getSubjectTrailStats(readings: Reading[]): TrailStats {
  const valid = readings.filter(hasValidGps);
  const failed = readings.filter(
    (r) => r.gpsFixStatus !== "acquired",
  ).length;

  return {
    totalReadings: readings.length,
    validGPSReadings: valid.length,
    gpsFailed: failed,
    distanceKm: calculateDistance(valid),
  };
}

function calculateDistance(
  readings: Array<{ gpsLat: number; gpsLng: number }>,
): number | null {
  if (readings.length < 2) return null;
  let total = 0;
  for (let i = 1; i < readings.length; i++) {
    total += haversineKm(
      readings[i - 1].gpsLat,
      readings[i - 1].gpsLng,
      readings[i].gpsLat,
      readings[i].gpsLng,
    );
  }
  return Math.round(total * 10) / 10;
}

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── GeoJSON builders ───────────────────────────────────────────

export function readingsToTrailLine(
  readings: Reading[],
): GeoJSONFeature<GeoJSONLineString> | null {
  const sorted = readings
    .filter(hasValidGps)
    .sort(
      (a, b) =>
        new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
    );

  if (sorted.length < 2) return null;

  return {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: sorted.map((r) => [r.gpsLng!, r.gpsLat!]),
    },
    properties: {},
  };
}
