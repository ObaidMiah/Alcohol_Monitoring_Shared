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
