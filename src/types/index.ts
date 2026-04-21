// ── Enums & Literals ────────────────────────────────────────────

export type Role = "subject" | "officer" | "supervisor" | "org_admin" | "system_admin";

export type ProgramStatus = "active" | "completed" | "revoked" | "suspended";

export type DeviceStatus = "in_stock" | "active" | "in_repair" | "decommissioned";

export type SubjectStatus = "compliant" | "attention" | "violation" | "offline";

export type GpsFixStatus = "acquired" | "searching" | "lost";

export type TransmissionPath = "ble" | "wifi" | "cellular";

export type ReadingResult = "pass" | "fail" | "no_data";

export type EventType =
  | "tamper_ir_detected"
  | "tamper_ir_cleared"
  | "wrist_on"
  | "wrist_off"
  | "battery_low"
  | "battery_critical"
  | "battery_charging"
  | "battery_full"
  | "device_paired"
  | "device_unpaired"
  | "reading_missed"
  | "geofence_enter"
  | "geofence_exit"
  | "curfew_violation"
  | "manual_check_in";

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

export interface Reading {
  readonly id: number;
  readonly subjectId: string;
  readonly deviceId: string;
  readonly bac?: number;
  readonly skinTempC?: number;
  readonly motionMg?: number;
  readonly batteryPercent?: number;
  readonly wristOn: boolean;
  readonly gpsLat?: number;
  readonly gpsLng?: number;
  readonly gpsFixStatus?: GpsFixStatus;
  readonly gpsAccuracyM?: number;
  readonly transmissionPath?: TransmissionPath;
  readonly recordedAt: string;
  readonly receivedAt: string;
}

export interface Event {
  readonly id: string;
  readonly subjectId: string;
  readonly deviceId?: string;
  readonly eventType: EventType;
  readonly metadata?: Record<string, unknown>;
  readonly recordedAt: string;
  readonly receivedAt: string;
}

export interface OrgSettings {
  readonly id: string;
  readonly org_id: string;
  readonly bac_threshold: number;
  readonly reading_interval_mins: number;
  readonly wrist_off_alert_mins: number;
  readonly geofence_enabled: boolean;
  readonly curfew_enabled: boolean;
  readonly created_at: string;
  readonly updated_at: string;
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

// ── Composite / View Types ──────────────────────────────────────

export interface MapSubject {
  readonly subject: Subject;
  readonly account: Pick<Account, "first_name" | "last_name" | "email" | "phone">;
  readonly latest_reading: Reading | null;
  readonly status: SubjectStatus;
}

export interface SubjectSummary {
  readonly subject: Subject;
  readonly account: Pick<Account, "first_name" | "last_name" | "email" | "phone">;
  readonly streak: {
    readonly current: number;
    readonly longest: number;
  };
  readonly latest_reading: Reading | null;
  readonly program: {
    readonly status: ProgramStatus;
    readonly enrolled_at: string;
    readonly program_end_at?: string;
    readonly days_remaining: number | null;
  };
  readonly last_7_days: {
    readonly reading_count: number;
    readonly event_count: number;
    readonly violation_count: number;
    readonly missed_readings: number;
  };
}

// ── API Response Types ──────────────────────────────────────────

export interface CreateReadingResponse {
  readonly id: number;
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
  readonly has_more: boolean;
}

export interface EventsListResponse {
  readonly events: Event[];
  readonly count: number;
}

// ── API Request / Payload Types ─────────────────────────────────

export interface CreateReadingPayload {
  subject_id: string;
  device_id: string;
  ethanol_bac?: number;
  skin_temp_c?: number;
  motion_mg?: number;
  battery_pct?: number;
  wrist_on: boolean;
  gps_lat?: number;
  gps_lng?: number;
  gps_fix_status?: GpsFixStatus;
  gps_accuracy_m?: number;
  transmission_path?: TransmissionPath;
  recorded_at: string;
}

export interface CreateEventPayload {
  subject_id: string;
  device_id?: string;
  event_type: EventType;
  metadata?: Record<string, unknown>;
  recorded_at: string;
}

export interface CreateSubjectPayload {
  account_id: string;
  org_id: string;
  case_number?: string;
  notes?: string;
  program_end_at?: string;
}

export interface CreateOfficerPayload {
  account_id: string;
  org_id: string;
  badge_number?: string;
  department?: string;
}

export interface UpdateSubjectStatusPayload {
  program_status: ProgramStatus;
}

export interface DateRangeParams {
  start?: string;
  end?: string;
}

export interface EventFilterParams extends DateRangeParams {
  event_type?: EventType;
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
  readonly batteryPercent?: number;
  readonly wristOn: boolean;
  readonly gpsAccuracyM?: number;
  readonly transmissionPath?: TransmissionPath;
  readonly bac?: number;
}

// ── Error Types ─────────────────────────────────────────────────

export interface ValidationErrorDetail {
  readonly field: string;
  readonly message: string;
}

export interface ApiErrorResponse {
  readonly error: string;
  readonly details?: ValidationErrorDetail[];
}
