// ── Enums & Literals ────────────────────────────────────────────

export type Role = "subject" | "officer" | "supervisor" | "org_admin" | "system_admin";

export type ProgramStatus = "active" | "completed" | "revoked" | "suspended";

export type DeviceStatus = "in_stock" | "active" | "in_repair" | "decommissioned";

export type SubjectStatus = "compliant" | "attention" | "violation" | "offline";

export type GpsFixStatus = "acquired" | "failed" | "disabled" | "stale";

export type TransmissionPath = "ble" | "cellular";

export type ReadingResult = "pass" | "fail" | "no_data";

export type EventType =
  | "tamper_ir_detected"
  | "tamper_ir_cleared"
  | "wrist_removed"
  | "wrist_reattached"
  | "ble_connected"
  | "ble_disconnected"
  | "cellular_connected"
  | "cellular_lost"
  | "battery_low_20"
  | "battery_low_10"
  | "battery_critical_5"
  | "device_powered_on"
  | "device_powered_off"
  | "reading_missed"
  | "charging_started"
  | "charging_stopped";

export type AlertEventType =
  | "violation"
  | "tamper"
  | "wrist_off"
  | "battery_low"
  | "connectivity"
  | "missed_reading";

export type AlertSeverity = "critical" | "warning" | "info";

// ── Database Entities (readonly) ────────────────────────────────

export interface Organization {
  readonly id: string;
  readonly name: string;
  readonly address?: string;
  readonly city?: string;
  readonly state?: string;
  readonly zip?: string;
  readonly phone?: string;
  readonly email?: string;
  readonly is_active: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface Account {
  readonly id: string;
  readonly cognito_sub: string;
  readonly email: string;
  readonly role: Role;
  readonly org_id: string;
  readonly first_name: string;
  readonly last_name: string;
  readonly phone?: string;
  readonly is_active: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface Officer {
  readonly id: string;
  readonly account_id: string;
  readonly org_id: string;
  readonly badge_number?: string;
  readonly department?: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface Subject {
  readonly id: string;
  readonly account_id: string;
  readonly org_id: string;
  readonly program_status: ProgramStatus;
  readonly enrolled_at: string;
  readonly program_end_at?: string;
  readonly case_number?: string;
  readonly notes?: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface OfficerSubjectAssignment {
  readonly id: string;
  readonly officer_id: string;
  readonly subject_id: string;
  readonly assigned_at: string;
  readonly unassigned_at?: string;
  readonly is_active: boolean;
}

export interface Device {
  readonly id: string;
  readonly serial_number: string;
  readonly model: string;
  readonly firmware_version?: string;
  readonly org_id: string;
  readonly status: DeviceStatus;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface DeviceAssignment {
  readonly id: string;
  readonly device_id: string;
  readonly subject_id: string;
  readonly assigned_at: string;
  readonly unassigned_at?: string;
  readonly is_active: boolean;
}

// ── API Response Entities (camelCase, matches API output) ───────

export interface Reading {
  readonly id: string;
  readonly subjectId: string;
  readonly deviceId: string;
  readonly recordedAt: string;
  readonly receivedAt: string;
  readonly sequenceNumber: number;
  readonly ethanolRaw: number | null;
  readonly bac: number | null;
  readonly gpsLat: number | null;
  readonly gpsLng: number | null;
  readonly gpsAccuracyM: number | null;
  readonly gpsFixStatus: GpsFixStatus | null;
  readonly batteryPercent: number | null;
  readonly wristOn: boolean | null;
  readonly transmissionPath: TransmissionPath | null;
}

export interface Event {
  readonly id: string;
  readonly subjectId: string;
  readonly deviceId: string;
  readonly type: EventType;
  readonly recordedAt: string;
  readonly receivedAt: string;
  readonly metadata: Record<string, unknown> | null;
}

// ── Composite / View Types (match API response shapes) ──────────

export interface SubjectListItem {
  readonly id: string;
  readonly name: string;
  readonly caseNumber: string | null;
  readonly status: SubjectStatus;
  readonly lastReadingAt: string | null;
  readonly bac: number;
  readonly batteryPercent: number | null;
  readonly streak: number;
  readonly programEndDate: string | null;
}

export interface SubjectDetail {
  readonly id: string;
  readonly name: string;
  readonly caseNumber: string | null;
  readonly status: SubjectStatus;
  readonly programStartDate: string;
  readonly programEndDate: string | null;
  readonly streak: number;
  readonly readingsThisWeek: number;
  readonly violationsThisWeek: number;
  readonly missedThisWeek: number;
  readonly devices: {
    readonly id: string;
    readonly model: string;
    readonly firmwareVersion: string | null;
    readonly batteryPercent: number | null;
    readonly assignedAt: string;
  }[];
}

export interface MapSubject {
  readonly id: string;
  readonly name: string;
  readonly caseNumber: string | null;
  readonly status: SubjectStatus;
  readonly lat: number | null;
  readonly lng: number | null;
  readonly streak: number;
  readonly latestReading: {
    readonly bac: number;
    readonly batteryPercent: number | null;
    readonly wristStatus: "on" | "off" | "tamper";
    readonly gpsTimestamp: string;
  } | null;
}

export interface SubjectSummary {
  readonly enrolledAt: string;
  readonly programStatus: ProgramStatus;
  readonly programEndAt: string | null;
  readonly streak: {
    readonly currentStreak: number;
    readonly longestStreak: number;
    readonly streakStarted: string | null;
  } | null;
  readonly latestReading: Reading | null;
  readonly readingsLast7Days: number;
  readonly eventsLast7Days: number;
}

export interface AlertItem {
  readonly id: string;
  readonly subjectId: string;
  readonly subjectName: string;
  readonly caseNumber: string | null;
  readonly type: AlertEventType;
  readonly severity: AlertSeverity;
  readonly message: string;
  readonly recordedAt: string;
  readonly read: boolean;
}

// ── Org Settings (matches API response) ─────────────────────────

export interface OrgSettings {
  readonly orgName: string;
  readonly primaryColor: string | null;
  readonly bacThreshold: number;
  readonly readingIntervalMin: number;
  readonly wristOffAlertMin: number;
  readonly missedReadingsBeforeAlert: number;
  readonly smsOnViolation: boolean;
  readonly emailOnViolation: boolean;
  readonly dailyDigest: boolean;
  readonly digestTime: string;
}

export interface SubjectAchievement {
  readonly id: string;
  readonly subject_id: string;
  readonly achievement_type: string;
  readonly achieved_at: string;
  readonly created_at: string;
}

export interface SubjectStreak {
  readonly id: string;
  readonly subject_id: string;
  readonly streak_type: string;
  readonly current_count: number;
  readonly longest_count: number;
  readonly last_updated_at: string;
  readonly created_at: string;
}

// ── API Response Types ──────────────────────────────────────────

export interface CreateReadingResponse {
  readonly id: string;
  readonly recorded_at: string;
}

export interface CreateEventResponse {
  readonly id: string;
}

export interface BatchEventResponse {
  readonly count: number;
  readonly ids: string[];
}

export interface ReadingsListResponse {
  readonly readings: Reading[];
  readonly count: number;
  readonly hasMore: boolean;
}

export interface EventsListResponse {
  readonly events: Event[];
  readonly count: number;
}

// ── API Request / Payload Types (snake_case, matches API input) ─

export interface CreateReadingPayload {
  device_id: string;
  subject_id: string;
  recorded_at: string;
  sequence_number: number;
  ethanol_raw?: number;
  ethanol_bac?: number;
  gps_lat?: number;
  gps_lng?: number;
  gps_accuracy_m?: number;
  gps_fix_status?: GpsFixStatus;
  battery_pct?: number;
  wrist_on?: boolean;
  transmission_path: TransmissionPath;
  raw_payload: Record<string, unknown>;
}

export interface CreateEventPayload {
  device_id: string;
  subject_id: string;
  event_type: EventType;
  recorded_at: string;
  metadata?: Record<string, unknown>;
}

export interface EnrollSubjectPayload {
  name: string;
  email: string;
  caseNumber: string;
  programStartDate: string;
  programEndDate: string;
  assignedOfficerId: string;
  deviceId: string;
  // Cognito user pool sub. When provided, the API aligns accounts.id to this
  // value so the user can sign in and resolve their account via jwt.sub.
  cognitoSub?: string;
}

export interface CreateOfficerPayload {
  name: string;
  email: string;
  badgeNumber: string;
  cognitoSub?: string;
}

export interface UpdateDeviceStatusPayload {
  status: "in_repair" | "decommissioned";
}

export interface UpdateOrgSettingsPayload {
  bacThreshold?: number;
  readingIntervalMin?: number;
  wristOffAlertMin?: number;
  missedReadingsBeforeAlert?: number;
  smsOnViolation?: boolean;
  emailOnViolation?: boolean;
  dailyDigest?: boolean;
  digestTime?: string;
  primaryColor?: string | null;
}

export interface EventFilterParams {
  start?: string;
  end?: string;
  event_type?: EventType;
  limit?: number;
}

export interface ReadingsFilterParams {
  start: string;
  end: string;
  limit?: number;
}

export interface AlertsFilterParams {
  type?: AlertEventType;
  limit?: number;
}

// ── Admin Response Types ────────────────────────────────────────

export interface AdminSubjectListItem {
  readonly id: string;
  readonly name: string;
  readonly caseNumber: string | null;
  readonly status: SubjectStatus;
  readonly officerName: string;
  readonly officerId: string | null;
  readonly programStartDate: string;
  readonly programEndDate: string | null;
}

export interface AdminOfficerListItem {
  readonly id: string;
  readonly name: string;
  readonly email?: string;
  readonly badgeNumber?: string;
  readonly subjectCount?: number;
  readonly lastLogin?: string;
  readonly isActive?: boolean;
}

export interface AdminDeviceListItem {
  readonly id: string;
  readonly serialNumber: string;
  readonly model: string;
  readonly firmwareVersion: string | null;
  readonly latestFirmware?: string;
  readonly status: string;
  readonly batteryPercent?: number;
  readonly assignedSubjectName?: string | null;
  readonly assignedSubjectId?: string | null;
}

export interface DeviceHistoryItem {
  readonly id: string;
  readonly subjectName: string;
  readonly assignedAt: string;
  readonly removedAt: string | null;
}

// ── GeoJSON Types ───────────────────────────────────────────────

export interface GeoJSONPoint {
  readonly type: "Point";
  readonly coordinates: [number, number]; // [lng, lat]
}

export interface GeoJSONLineString {
  readonly type: "LineString";
  readonly coordinates: [number, number][]; // [lng, lat][]
}

export interface GeoJSONFeature<
  G extends GeoJSONPoint | GeoJSONLineString = GeoJSONPoint,
  P = Record<string, unknown>,
> {
  readonly type: "Feature";
  readonly geometry: G;
  readonly properties: P;
}

export interface GeoJSONFeatureCollection<
  G extends GeoJSONPoint | GeoJSONLineString = GeoJSONPoint,
  P = Record<string, unknown>,
> {
  readonly type: "FeatureCollection";
  readonly features: GeoJSONFeature<G, P>[];
}

export interface ReadingPointProperties {
  readonly recordedAt: string;
  readonly result: ReadingResult;
  readonly batteryPercent: number | null;
  readonly wristOn: boolean | null;
  readonly gpsAccuracyM: number | null;
  readonly transmissionPath: TransmissionPath | null;
  readonly bac?: number | null;
}

// ── Error Types ─────────────────────────────────────────────────

export interface ValidationErrorDetail {
  readonly field: string;
  readonly messages: string[];
}

export interface ApiErrorResponse {
  readonly success: false;
  readonly error: {
    readonly message: string;
    readonly statusCode?: number;
    readonly details?: Record<string, string[]>;
  };
}
