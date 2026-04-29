import type { DeviceStatus, EventType, Role, SubjectStatus } from "../types";

export const EVENT_TYPES: EventType[] = [
  "tamper_ir_detected",
  "tamper_ir_cleared",
  "wrist_removed",
  "wrist_reattached",
  "ble_connected",
  "ble_disconnected",
  "cellular_connected",
  "cellular_lost",
  "battery_low_20",
  "battery_low_10",
  "battery_critical_5",
  "device_powered_on",
  "device_powered_off",
  "reading_missed",
  "charging_started",
  "charging_stopped",
];

export const SUBJECT_STATUS_COLORS: Record<SubjectStatus, string> = {
  compliant: "#1D9E75",
  attention: "#BA7517",
  violation: "#E05A38",
  offline: "#888780",
};

export const ROLES: Record<string, Role> = {
  SUBJECT: "subject",
  OFFICER: "officer",
  SUPERVISOR: "supervisor",
  ORG_ADMIN: "org_admin",
  SYSTEM_ADMIN: "system_admin",
};

export const DEVICE_STATUSES: Record<string, DeviceStatus> = {
  IN_STOCK: "in_stock",
  ACTIVE: "active",
  IN_REPAIR: "in_repair",
  DECOMMISSIONED: "decommissioned",
};

export const BAC_DEFAULT_THRESHOLD = 0.02;

export const READING_INTERVAL_MINS = 30;

export const WRIST_OFF_ALERT_MINS = 15;
