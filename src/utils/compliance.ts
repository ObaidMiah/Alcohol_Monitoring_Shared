import type { Event, Reading, ReadingResult, Role, SubjectStatus } from "../types";
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

  const age = Date.now() - new Date(latestReading.recordedAt).getTime();

  // No reading in last 2 hours → offline
  if (age > 2 * 60 * 60 * 1000) return "offline";

  // Tamper event in last hour OR BAC above threshold → violation
  const recentTamper = recentEvents.some(
    (e) =>
      e.eventType === "tamper_ir_detected" &&
      Date.now() - new Date(e.recordedAt).getTime() < 60 * 60 * 1000,
  );

  if (recentTamper || (latestReading.bac ?? 0) > BAC_DEFAULT_THRESHOLD) {
    return "violation";
  }

  // Battery low OR wrist off OR missed reading window → attention
  if (
    (latestReading.batteryPercent ?? 100) <= 20 ||
    latestReading.wristOn === false ||
    age > READING_INTERVAL_MINS * 60 * 1000 * 1.5
  ) {
    return "attention";
  }

  return "compliant";
}

export function getReadingResult(reading: Reading): ReadingResult {
  if (reading.bac == null) return "no_data";
  return reading.bac > BAC_DEFAULT_THRESHOLD ? "fail" : "pass";
}

const BAC_VISIBLE_ROLES: ReadonlySet<Role> = new Set([
  "officer",
  "supervisor",
  "org_admin",
  "system_admin",
]);

export function canViewBAC(role: Role): boolean {
  return BAC_VISIBLE_ROLES.has(role);
}

export function isCompliant(status: SubjectStatus): boolean {
  return status === "compliant";
}

export function requiresAttention(status: SubjectStatus): boolean {
  return status === "attention" || status === "violation";
}
