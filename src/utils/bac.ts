import { BAC_DEFAULT_THRESHOLD, SUBJECT_STATUS_COLORS } from "../constants";

export function formatBac(value: number | null | undefined): string {
  if (value == null) return "--";
  return value.toFixed(3);
}

export function getBacColor(value: number | null | undefined): string {
  if (value == null) return SUBJECT_STATUS_COLORS.offline;
  if (value > BAC_DEFAULT_THRESHOLD) return SUBJECT_STATUS_COLORS.violation;
  if (value > 0) return SUBJECT_STATUS_COLORS.attention;
  return SUBJECT_STATUS_COLORS.compliant;
}

export function isBacAboveThreshold(
  value: number | null | undefined,
  threshold: number = BAC_DEFAULT_THRESHOLD,
): boolean {
  if (value == null) return false;
  return value > threshold;
}
