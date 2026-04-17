import type { Event, Reading, SubjectStatus } from "../types";
import { BAC_DEFAULT_THRESHOLD, READING_INTERVAL_MINS } from "../constants";

/**
 * Single source of truth for deriving a subject's compliance status
 * from their latest reading and recent events.
 */
export function deriveSubjectStatus(
  latestReading: Reading | null,
  recentEvents: Event[],
): SubjectStatus {
  if (!latestReading) return "offline";

  const age = Date.now() - new Date(latestReading.recorded_at).getTime();

  // No reading in last 2 hours → offline
  if (age > 2 * 60 * 60 * 1000) return "offline";

  // Tamper event in last hour OR BAC above threshold → violation
  const recentTamper = recentEvents.some(
    (e) =>
      e.event_type === "tamper_ir_detected" &&
      Date.now() - new Date(e.recorded_at).getTime() < 60 * 60 * 1000,
  );

  if (recentTamper || (latestReading.ethanol_bac ?? 0) > BAC_DEFAULT_THRESHOLD) {
    return "violation";
  }

  // Battery low OR wrist off OR missed reading window → attention
  if (
    (latestReading.battery_pct ?? 100) <= 20 ||
    latestReading.wrist_on === false ||
    age > READING_INTERVAL_MINS * 60 * 1000 * 1.5
  ) {
    return "attention";
  }

  return "compliant";
}

export function isCompliant(status: SubjectStatus): boolean {
  return status === "compliant";
}

export function requiresAttention(status: SubjectStatus): boolean {
  return status === "attention" || status === "violation";
}
