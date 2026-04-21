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

function hasValidGps(
  reading: Reading,
): reading is Reading & { gps_lat: number; gps_lng: number } {
  return (
    reading.gps_lat != null &&
    reading.gps_lng != null &&
    reading.gps_fix_status === "acquired"
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
        recorded_at: reading.recorded_at,
        result: getReadingResult(reading),
        battery_pct: reading.battery_pct,
        wrist_on: reading.wrist_on,
        gps_accuracy_m: reading.gps_accuracy_m,
        transmission_path: reading.transmission_path,
        ...(showBac ? { ethanol_bac: reading.ethanol_bac } : {}),
      };

      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [reading.gps_lng, reading.gps_lat],
        },
        properties,
      };
    });

  return { type: "FeatureCollection", features };
}

export function readingsToTrailLine(
  readings: Reading[],
): GeoJSONFeature<GeoJSONLineString> | null {
  const sorted = readings
    .filter(hasValidGps)
    .sort(
      (a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
    );

  if (sorted.length < 2) return null;

  return {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: sorted.map((r) => [r.gps_lng!, r.gps_lat!]),
    },
    properties: {},
  };
}
