type Role = "subject" | "officer" | "supervisor" | "org_admin" | "system_admin";
type ProgramStatus = "active" | "completed" | "revoked" | "suspended";
type DeviceStatus = "in_stock" | "active" | "in_repair" | "decommissioned";
type SubjectStatus = "compliant" | "attention" | "violation" | "offline";
type GpsFixStatus = "acquired" | "failed" | "disabled" | "stale";
type TransmissionPath = "ble" | "cellular";
type ReadingResult = "pass" | "fail" | "no_data";
type EventType = "tamper_ir_detected" | "tamper_ir_cleared" | "wrist_removed" | "wrist_reattached" | "ble_connected" | "ble_disconnected" | "cellular_connected" | "cellular_lost" | "battery_low_20" | "battery_low_10" | "battery_critical_5" | "device_powered_on" | "device_powered_off" | "reading_missed" | "charging_started" | "charging_stopped";
type AlertEventType = "violation" | "tamper" | "wrist_off" | "battery_low" | "connectivity" | "missed_reading";
type AlertSeverity = "critical" | "warning" | "info";
interface Organization {
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
interface Account {
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
interface Officer {
    readonly id: string;
    readonly account_id: string;
    readonly org_id: string;
    readonly badge_number?: string;
    readonly department?: string;
    readonly created_at: string;
    readonly updated_at: string;
}
interface Subject {
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
interface OfficerSubjectAssignment {
    readonly id: string;
    readonly officer_id: string;
    readonly subject_id: string;
    readonly assigned_at: string;
    readonly unassigned_at?: string;
    readonly is_active: boolean;
}
interface Device {
    readonly id: string;
    readonly serial_number: string;
    readonly model: string;
    readonly firmware_version?: string;
    readonly org_id: string;
    readonly status: DeviceStatus;
    readonly created_at: string;
    readonly updated_at: string;
}
interface DeviceAssignment {
    readonly id: string;
    readonly device_id: string;
    readonly subject_id: string;
    readonly assigned_at: string;
    readonly unassigned_at?: string;
    readonly is_active: boolean;
}
interface Reading {
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
interface Event {
    readonly id: string;
    readonly subjectId: string;
    readonly deviceId: string;
    readonly type: EventType;
    readonly recordedAt: string;
    readonly receivedAt: string;
    readonly metadata: Record<string, unknown> | null;
}
interface SubjectListItem {
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
interface SubjectDetail {
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
interface MapSubject {
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
interface SubjectSummary {
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
interface AlertItem {
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
interface OrgSettings {
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
interface SubjectAchievement {
    readonly id: string;
    readonly subject_id: string;
    readonly achievement_type: string;
    readonly achieved_at: string;
    readonly created_at: string;
}
interface SubjectStreak {
    readonly id: string;
    readonly subject_id: string;
    readonly streak_type: string;
    readonly current_count: number;
    readonly longest_count: number;
    readonly last_updated_at: string;
    readonly created_at: string;
}
interface CreateReadingResponse {
    readonly id: string;
    readonly recorded_at: string;
}
interface CreateEventResponse {
    readonly id: string;
}
interface BatchEventResponse {
    readonly count: number;
    readonly ids: string[];
}
interface ReadingsListResponse {
    readonly readings: Reading[];
    readonly count: number;
    readonly hasMore: boolean;
}
interface EventsListResponse {
    readonly events: Event[];
    readonly count: number;
}
interface CreateReadingPayload {
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
interface CreateEventPayload {
    device_id: string;
    subject_id: string;
    event_type: EventType;
    recorded_at: string;
    metadata?: Record<string, unknown>;
}
interface EnrollSubjectPayload {
    name: string;
    email: string;
    caseNumber: string;
    programStartDate: string;
    programEndDate: string;
    assignedOfficerId: string;
    deviceId: string;
    cognitoSub?: string;
}
interface CreateOfficerPayload {
    name: string;
    email: string;
    badgeNumber: string;
    cognitoSub?: string;
}
interface UpdateDeviceStatusPayload {
    status: "in_repair" | "decommissioned";
}
interface UpdateOrgSettingsPayload {
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
interface EventFilterParams {
    start?: string;
    end?: string;
    event_type?: EventType;
    limit?: number;
}
interface ReadingsFilterParams {
    start: string;
    end: string;
    limit?: number;
}
interface AlertsFilterParams {
    type?: AlertEventType;
    limit?: number;
}
interface AdminSubjectListItem {
    readonly id: string;
    readonly name: string;
    readonly caseNumber: string | null;
    readonly status: SubjectStatus;
    readonly officerName: string;
    readonly officerId: string | null;
    readonly programStartDate: string;
    readonly programEndDate: string | null;
}
interface AdminOfficerListItem {
    readonly id: string;
    readonly name: string;
    readonly email?: string;
    readonly badgeNumber?: string;
    readonly subjectCount?: number;
    readonly lastLogin?: string;
    readonly isActive?: boolean;
}
interface AdminDeviceListItem {
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
interface DeviceHistoryItem {
    readonly id: string;
    readonly subjectName: string;
    readonly assignedAt: string;
    readonly removedAt: string | null;
}
interface GeoJSONPoint {
    readonly type: "Point";
    readonly coordinates: [number, number];
}
interface GeoJSONLineString {
    readonly type: "LineString";
    readonly coordinates: [number, number][];
}
interface GeoJSONFeature<G extends GeoJSONPoint | GeoJSONLineString = GeoJSONPoint, P = Record<string, unknown>> {
    readonly type: "Feature";
    readonly geometry: G;
    readonly properties: P;
}
interface GeoJSONFeatureCollection<G extends GeoJSONPoint | GeoJSONLineString = GeoJSONPoint, P = Record<string, unknown>> {
    readonly type: "FeatureCollection";
    readonly features: GeoJSONFeature<G, P>[];
}
interface ReadingPointProperties {
    readonly recordedAt: string;
    readonly result: ReadingResult;
    readonly batteryPercent: number | null;
    readonly wristOn: boolean | null;
    readonly gpsAccuracyM: number | null;
    readonly transmissionPath: TransmissionPath | null;
    readonly bac?: number | null;
}
interface ValidationErrorDetail {
    readonly field: string;
    readonly messages: string[];
}
interface ApiErrorResponse {
    readonly success: false;
    readonly error: {
        readonly message: string;
        readonly statusCode?: number;
        readonly details?: Record<string, string[]>;
    };
}

declare const EVENT_TYPES: EventType[];
declare const SUBJECT_STATUS_COLORS: Record<SubjectStatus, string>;
declare const ROLES: Record<string, Role>;
declare const DEVICE_STATUSES: Record<string, DeviceStatus>;
declare const BAC_DEFAULT_THRESHOLD = 0.02;
declare const READING_INTERVAL_MINS = 30;
declare const WRIST_OFF_ALERT_MINS = 15;

declare class ApiError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number);
}
declare class ValidationError extends ApiError {
    fields: Record<string, string[]>;
    constructor(message: string, fields: Record<string, string[]>);
}
declare class NetworkError extends Error {
    constructor(message: string);
}
interface ApiClientConfig {
    getToken: () => string | null | Promise<string | null>;
    baseUrl: string;
    onUnauthorized?: () => void;
}
declare function initApiClient(clientConfig: ApiClientConfig): void;
declare function apiFetch<T>(path: string, options?: RequestInit): Promise<T>;

interface CognitoConfig {
    userPoolId: string;
    clientId: string;
    region: string;
}
declare function getCognitoConfig(): CognitoConfig;
interface AuthResult {
    AccessToken: string;
    IdToken: string;
    RefreshToken?: string;
    ExpiresIn: number;
}
declare function signIn(username: string, password: string): Promise<AuthResult>;
declare function refreshToken(refreshTokenValue: string): Promise<AuthResult>;
interface SignUpResponse {
    UserConfirmed: boolean;
    UserSub: string;
}
declare function signUp(username: string, password: string, email: string): Promise<SignUpResponse>;
declare function confirmSignUp(username: string, code: string): Promise<void>;
declare function forgotPassword(username: string): Promise<void>;
declare function confirmForgotPassword(username: string, code: string, newPassword: string): Promise<void>;
declare function signOut(accessToken: string): Promise<void>;

declare function postEvent(payload: CreateEventPayload): Promise<CreateEventResponse>;
declare function postEventBatch(events: CreateEventPayload[]): Promise<BatchEventResponse>;

declare function postReading(payload: CreateReadingPayload): Promise<CreateReadingResponse>;

declare function getSubjects(): Promise<SubjectListItem[]>;
declare function getSubjectDetail(subjectId: string): Promise<SubjectDetail>;
declare function getSubjectReadings(subjectId: string, params: ReadingsFilterParams): Promise<ReadingsListResponse>;
declare function getLatestReading(subjectId: string): Promise<Reading | null>;
declare function getSubjectEvents(subjectId: string, params?: EventFilterParams): Promise<EventsListResponse>;
declare function getSubjectSummary(subjectId: string): Promise<SubjectSummary>;
declare function getMapSubjects(): Promise<MapSubject[]>;
declare function getAlerts(params?: AlertsFilterParams): Promise<AlertItem[]>;
declare function getMe(): Promise<{
    id: string;
}>;

declare function getOrgSettings(): Promise<OrgSettings>;
declare function updateOrgSettings(payload: UpdateOrgSettingsPayload): Promise<OrgSettings>;
declare function getOfficers(fields?: string): Promise<AdminOfficerListItem[]>;
declare function createOfficer(payload: CreateOfficerPayload): Promise<AdminOfficerListItem>;
declare function deactivateOfficer(officerId: string): Promise<{
    id: string;
    isActive: boolean;
}>;
declare function getOfficerSubjects(officerId: string): Promise<SubjectListItem[]>;
declare function getAdminSubjects(): Promise<AdminSubjectListItem[]>;
declare function enrollSubject(payload: EnrollSubjectPayload): Promise<{
    id: string;
}>;
declare function getDevices(status?: string): Promise<AdminDeviceListItem[]>;
declare function getDeviceHistory(deviceId: string): Promise<DeviceHistoryItem[]>;
declare function updateDeviceStatus(deviceId: string, payload: UpdateDeviceStatusPayload): Promise<{
    id: string;
    status: string;
}>;

declare function formatBac(value: number | null | undefined): string;
declare function getBacColor(value: number | null | undefined): string;
declare function isBacAboveThreshold(value: number | null | undefined, threshold?: number): boolean;

/**
 * Single source of truth for deriving a subject's compliance status
 * from their latest reading and recent events.
 */
declare function deriveSubjectStatus(latestReading: Reading | null, recentEvents: Event[]): SubjectStatus;
declare function getReadingResult(reading: Reading): ReadingResult;
/**
 * Only system_admin can see raw BAC values.
 * All other roles see compliant/non-compliant results only.
 */
declare function canViewBAC(role: Role): boolean;
declare function isCompliant(status: SubjectStatus): boolean;
declare function requiresAttention(status: SubjectStatus): boolean;

declare function formatDate(isoString: string): string;
declare function formatTime(isoString: string): string;
declare function formatDateTime(isoString: string): string;
declare function timeAgo(isoString: string): string;
declare function isWithinMinutes(isoString: string, minutes: number): boolean;
declare function minutesAgo(isoString: string): number;

declare const READING_RESULT_CONFIG: {
    readonly compliant: {
        readonly label: "Compliant";
        readonly shortLabel: "✓ Compliant";
        readonly color: "#1D9E75";
        readonly bgColor: "#E1F5EE";
        readonly textColor: "#085041";
    };
    readonly non_compliant: {
        readonly label: "Non-compliant";
        readonly shortLabel: "✗ Non-compliant";
        readonly color: "#E05A38";
        readonly bgColor: "#FAECE7";
        readonly textColor: "#712B13";
    };
    readonly missed: {
        readonly label: "Missed reading";
        readonly shortLabel: "— Missed";
        readonly color: "#888780";
        readonly bgColor: "#F1EFE8";
        readonly textColor: "#444441";
    };
};
type ReadingResultKey = keyof typeof READING_RESULT_CONFIG;
declare function readingsToGeoJSON(readings: Reading[], role: Role): GeoJSONFeatureCollection<GeoJSONPoint, ReadingPointProperties>;
interface TrailStats {
    totalReadings: number;
    validGPSReadings: number;
    gpsFailed: number;
    distanceKm: number | null;
}
declare function getSubjectTrailStats(readings: Reading[]): TrailStats;
declare function readingsToTrailLine(readings: Reading[]): GeoJSONFeature<GeoJSONLineString> | null;

export { type Account, type AdminDeviceListItem, type AdminOfficerListItem, type AdminSubjectListItem, type AlertEventType, type AlertItem, type AlertSeverity, type AlertsFilterParams, ApiError, type ApiErrorResponse, BAC_DEFAULT_THRESHOLD, type BatchEventResponse, type CreateEventPayload, type CreateEventResponse, type CreateOfficerPayload, type CreateReadingPayload, type CreateReadingResponse, DEVICE_STATUSES, type Device, type DeviceAssignment, type DeviceHistoryItem, type DeviceStatus, EVENT_TYPES, type EnrollSubjectPayload, type Event, type EventFilterParams, type EventType, type EventsListResponse, type GeoJSONFeature, type GeoJSONFeatureCollection, type GeoJSONLineString, type GeoJSONPoint, type GpsFixStatus, type MapSubject, NetworkError, type Officer, type OfficerSubjectAssignment, type OrgSettings, type Organization, type ProgramStatus, READING_INTERVAL_MINS, READING_RESULT_CONFIG, ROLES, type Reading, type ReadingPointProperties, type ReadingResult, type ReadingResultKey, type ReadingsFilterParams, type ReadingsListResponse, type Role, SUBJECT_STATUS_COLORS, type Subject, type SubjectAchievement, type SubjectDetail, type SubjectListItem, type SubjectStatus, type SubjectStreak, type SubjectSummary, type TrailStats, type TransmissionPath, type UpdateDeviceStatusPayload, type UpdateOrgSettingsPayload, ValidationError, type ValidationErrorDetail, WRIST_OFF_ALERT_MINS, apiFetch, canViewBAC, confirmForgotPassword, confirmSignUp, createOfficer, deactivateOfficer, deriveSubjectStatus, enrollSubject, forgotPassword, formatBac, formatDate, formatDateTime, formatTime, getAdminSubjects, getAlerts, getBacColor, getCognitoConfig, getDeviceHistory, getDevices, getLatestReading, getMapSubjects, getMe, getOfficerSubjects, getOfficers, getOrgSettings, getReadingResult, getSubjectDetail, getSubjectEvents, getSubjectReadings, getSubjectSummary, getSubjectTrailStats, getSubjects, initApiClient, isBacAboveThreshold, isCompliant, isWithinMinutes, minutesAgo, postEvent, postEventBatch, postReading, readingsToGeoJSON, readingsToTrailLine, refreshToken, requiresAttention, signIn, signOut, signUp, timeAgo, updateDeviceStatus, updateOrgSettings };
