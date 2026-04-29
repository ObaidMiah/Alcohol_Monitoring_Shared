// src/constants/index.ts
var EVENT_TYPES = [
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
  "charging_stopped"
];
var SUBJECT_STATUS_COLORS = {
  compliant: "#1D9E75",
  attention: "#BA7517",
  violation: "#E05A38",
  offline: "#888780"
};
var ROLES = {
  SUBJECT: "subject",
  OFFICER: "officer",
  SUPERVISOR: "supervisor",
  ORG_ADMIN: "org_admin",
  SYSTEM_ADMIN: "system_admin"
};
var DEVICE_STATUSES = {
  IN_STOCK: "in_stock",
  ACTIVE: "active",
  IN_REPAIR: "in_repair",
  DECOMMISSIONED: "decommissioned"
};
var BAC_DEFAULT_THRESHOLD = 0.02;
var READING_INTERVAL_MINS = 30;
var WRIST_OFF_ALERT_MINS = 15;

// src/api/client.ts
var ApiError = class extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";
  }
};
var ValidationError = class extends ApiError {
  constructor(message, fields) {
    super(message, 400);
    this.fields = fields;
    this.name = "ValidationError";
  }
};
var NetworkError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "NetworkError";
  }
};
var config = null;
function initApiClient(clientConfig) {
  config = clientConfig;
}
function getConfig() {
  if (!config) {
    throw new Error(
      "API client not initialized. Call initApiClient() at app startup."
    );
  }
  return config;
}
async function apiFetch(path, options = {}) {
  const { getToken, baseUrl, onUnauthorized } = getConfig();
  const token = await getToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers ?? {}
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers
    });
  } catch (err) {
    throw new NetworkError(
      err instanceof Error ? err.message : "Network request failed"
    );
  }
  if (response.status === 401) {
    onUnauthorized?.();
    throw new ApiError("Unauthorized", 401);
  }
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    let body;
    try {
      body = await response.json();
    } catch {
    }
    if (response.status === 400 && body?.error?.details) {
      throw new ValidationError(
        body.error.message ?? "Validation failed",
        body.error.details
      );
    }
    if (response.status >= 500) {
      throw new ApiError("An unexpected server error occurred", response.status);
    }
    throw new ApiError(
      body?.error?.message ?? `Request failed with status ${response.status}`,
      response.status
    );
  }
  if (response.status === 204) {
    return null;
  }
  const json = await response.json();
  return json.data;
}

// src/api/auth.ts
function getCognitoConfig() {
  const userPoolId = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_COGNITO_USER_POOL_ID || typeof process !== "undefined" && process.env?.EXPO_PUBLIC_COGNITO_USER_POOL_ID || "";
  const clientId = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_COGNITO_WEB_CLIENT_ID || typeof process !== "undefined" && process.env?.EXPO_PUBLIC_COGNITO_MOBILE_CLIENT_ID || "";
  const region = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_COGNITO_REGION || typeof process !== "undefined" && process.env?.EXPO_PUBLIC_COGNITO_REGION || "us-west-2";
  return { userPoolId, clientId, region };
}
function getCognitoUrl() {
  const { region } = getCognitoConfig();
  return `https://cognito-idp.${region}.amazonaws.com/`;
}
async function cognitoRequest(action, payload) {
  const url = getCognitoUrl();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `AWSCognitoIdentityProviderService.${action}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? `Cognito ${action} failed`);
  }
  return response.json();
}
async function signIn(username, password) {
  const { clientId } = getCognitoConfig();
  const response = await cognitoRequest("InitiateAuth", {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: clientId,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password
    }
  });
  return response.AuthenticationResult;
}
async function refreshToken(refreshTokenValue) {
  const { clientId } = getCognitoConfig();
  const response = await cognitoRequest("InitiateAuth", {
    AuthFlow: "REFRESH_TOKEN_AUTH",
    ClientId: clientId,
    AuthParameters: {
      REFRESH_TOKEN: refreshTokenValue
    }
  });
  return response.AuthenticationResult;
}
async function signUp(username, password, email) {
  const { clientId } = getCognitoConfig();
  return cognitoRequest("SignUp", {
    ClientId: clientId,
    Username: username,
    Password: password,
    UserAttributes: [{ Name: "email", Value: email }]
  });
}
async function confirmSignUp(username, code) {
  const { clientId } = getCognitoConfig();
  await cognitoRequest("ConfirmSignUp", {
    ClientId: clientId,
    Username: username,
    ConfirmationCode: code
  });
}
async function forgotPassword(username) {
  const { clientId } = getCognitoConfig();
  await cognitoRequest("ForgotPassword", {
    ClientId: clientId,
    Username: username
  });
}
async function confirmForgotPassword(username, code, newPassword) {
  const { clientId } = getCognitoConfig();
  await cognitoRequest("ConfirmForgotPassword", {
    ClientId: clientId,
    Username: username,
    ConfirmationCode: code,
    Password: newPassword
  });
}
async function signOut(accessToken) {
  await cognitoRequest("GlobalSignOut", {
    AccessToken: accessToken
  });
}

// src/api/events.ts
async function postEvent(payload) {
  return apiFetch("/v1/events", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
async function postEventBatch(events) {
  return apiFetch("/v1/events/batch", {
    method: "POST",
    body: JSON.stringify(events)
  });
}

// src/api/readings.ts
async function postReading(payload) {
  return apiFetch("/v1/readings", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

// src/api/subjects.ts
async function getSubjects() {
  return apiFetch("/v1/subjects");
}
async function getSubjectDetail(subjectId) {
  return apiFetch(`/v1/subjects/${subjectId}`);
}
async function getSubjectReadings(subjectId, params) {
  const query = new URLSearchParams();
  query.set("start", params.start);
  query.set("end", params.end);
  if (params.limit != null) query.set("limit", String(params.limit));
  return apiFetch(
    `/v1/subjects/${subjectId}/readings?${query}`
  );
}
async function getLatestReading(subjectId) {
  return apiFetch(
    `/v1/subjects/${subjectId}/readings/latest`
  );
}
async function getSubjectEvents(subjectId, params) {
  const query = new URLSearchParams();
  if (params?.start) query.set("start", params.start);
  if (params?.end) query.set("end", params.end);
  if (params?.event_type) query.set("event_type", params.event_type);
  if (params?.limit != null) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiFetch(
    `/v1/subjects/${subjectId}/events${qs ? `?${qs}` : ""}`
  );
}
async function getSubjectSummary(subjectId) {
  return apiFetch(`/v1/subjects/${subjectId}/summary`);
}
async function getMapSubjects() {
  return apiFetch("/v1/subjects/map");
}
async function getAlerts(params) {
  const query = new URLSearchParams();
  if (params?.type) query.set("type", params.type);
  if (params?.limit != null) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiFetch(`/v1/alerts${qs ? `?${qs}` : ""}`);
}
async function getMe() {
  return apiFetch("/v1/me");
}

// src/api/admin.ts
async function getOrgSettings() {
  return apiFetch("/v1/admin/settings");
}
async function updateOrgSettings(payload) {
  return apiFetch("/v1/admin/settings", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}
async function getOfficers(fields) {
  const qs = fields ? `?fields=${fields}` : "";
  return apiFetch(`/v1/admin/officers${qs}`);
}
async function createOfficer(payload) {
  return apiFetch("/v1/admin/officers", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
async function deactivateOfficer(officerId) {
  return apiFetch(
    `/v1/admin/officers/${officerId}/deactivate`,
    { method: "POST" }
  );
}
async function getOfficerSubjects(officerId) {
  return apiFetch(
    `/v1/admin/officers/${officerId}/subjects`
  );
}
async function getAdminSubjects() {
  return apiFetch("/v1/admin/subjects");
}
async function enrollSubject(payload) {
  return apiFetch("/v1/admin/subjects/enroll", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
async function getDevices(status) {
  const qs = status ? `?status=${status}` : "";
  return apiFetch(`/v1/admin/devices${qs}`);
}
async function getDeviceHistory(deviceId) {
  return apiFetch(
    `/v1/admin/devices/${deviceId}/history`
  );
}
async function updateDeviceStatus(deviceId, payload) {
  return apiFetch(
    `/v1/admin/devices/${deviceId}/status`,
    {
      method: "PUT",
      body: JSON.stringify(payload)
    }
  );
}

// src/utils/bac.ts
function formatBac(value) {
  if (value == null) return "--";
  return value.toFixed(3);
}
function getBacColor(value) {
  if (value == null) return SUBJECT_STATUS_COLORS.offline;
  if (value > BAC_DEFAULT_THRESHOLD) return SUBJECT_STATUS_COLORS.violation;
  if (value > 0) return SUBJECT_STATUS_COLORS.attention;
  return SUBJECT_STATUS_COLORS.compliant;
}
function isBacAboveThreshold(value, threshold = BAC_DEFAULT_THRESHOLD) {
  if (value == null) return false;
  return value > threshold;
}

// src/utils/compliance.ts
function deriveSubjectStatus(latestReading, recentEvents) {
  if (!latestReading) return "offline";
  const age = Date.now() - new Date(latestReading.recordedAt).getTime();
  if (age > 2 * 60 * 60 * 1e3) return "offline";
  const recentTamper = recentEvents.some(
    (e) => e.type === "tamper_ir_detected" && Date.now() - new Date(e.recordedAt).getTime() < 60 * 60 * 1e3
  );
  if (recentTamper || (latestReading.bac ?? 0) > BAC_DEFAULT_THRESHOLD) {
    return "violation";
  }
  if ((latestReading.batteryPercent ?? 100) <= 20 || latestReading.wristOn === false || age > READING_INTERVAL_MINS * 60 * 1e3 * 1.5) {
    return "attention";
  }
  return "compliant";
}
function getReadingResult(reading) {
  if (reading.bac == null) return "no_data";
  return reading.bac > BAC_DEFAULT_THRESHOLD ? "fail" : "pass";
}
function canViewBAC(role) {
  return role === "system_admin";
}
function isCompliant(status) {
  return status === "compliant";
}
function requiresAttention(status) {
  return status === "attention" || status === "violation";
}

// src/utils/date.ts
function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}
function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}
function formatDateTime(isoString) {
  return `${formatDate(isoString)} ${formatTime(isoString)}`;
}
function timeAgo(isoString) {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 6e4);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
function isWithinMinutes(isoString, minutes) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  return diffMs <= minutes * 6e4;
}
function minutesAgo(isoString) {
  return Math.floor((Date.now() - new Date(isoString).getTime()) / 6e4);
}

// src/utils/map.ts
var READING_RESULT_CONFIG = {
  compliant: {
    label: "Compliant",
    shortLabel: "\u2713 Compliant",
    color: "#1D9E75",
    bgColor: "#E1F5EE",
    textColor: "#085041"
  },
  non_compliant: {
    label: "Non-compliant",
    shortLabel: "\u2717 Non-compliant",
    color: "#E05A38",
    bgColor: "#FAECE7",
    textColor: "#712B13"
  },
  missed: {
    label: "Missed reading",
    shortLabel: "\u2014 Missed",
    color: "#888780",
    bgColor: "#F1EFE8",
    textColor: "#444441"
  }
};
function hasValidGps(reading) {
  return reading.gpsLat != null && reading.gpsLng != null && reading.gpsFixStatus === "acquired";
}
function readingsToGeoJSON(readings, role) {
  const showBac = canViewBAC(role);
  const features = readings.filter(hasValidGps).map((reading) => {
    const properties = {
      recordedAt: reading.recordedAt,
      result: getReadingResult(reading),
      batteryPercent: reading.batteryPercent,
      wristOn: reading.wristOn,
      gpsAccuracyM: reading.gpsAccuracyM,
      transmissionPath: reading.transmissionPath,
      ...showBac ? { bac: reading.bac } : {}
    };
    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [reading.gpsLng, reading.gpsLat]
      },
      properties
    };
  });
  return { type: "FeatureCollection", features };
}
function getSubjectTrailStats(readings) {
  const valid = readings.filter(hasValidGps);
  const failed = readings.filter(
    (r) => r.gpsFixStatus !== "acquired"
  ).length;
  return {
    totalReadings: readings.length,
    validGPSReadings: valid.length,
    gpsFailed: failed,
    distanceKm: calculateDistance(valid)
  };
}
function calculateDistance(readings) {
  if (readings.length < 2) return null;
  let total = 0;
  for (let i = 1; i < readings.length; i++) {
    total += haversineKm(
      readings[i - 1].gpsLat,
      readings[i - 1].gpsLng,
      readings[i].gpsLat,
      readings[i].gpsLng
    );
  }
  return Math.round(total * 10) / 10;
}
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function readingsToTrailLine(readings) {
  const sorted = readings.filter(hasValidGps).sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );
  if (sorted.length < 2) return null;
  return {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: sorted.map((r) => [r.gpsLng, r.gpsLat])
    },
    properties: {}
  };
}
export {
  ApiError,
  BAC_DEFAULT_THRESHOLD,
  DEVICE_STATUSES,
  EVENT_TYPES,
  NetworkError,
  READING_INTERVAL_MINS,
  READING_RESULT_CONFIG,
  ROLES,
  SUBJECT_STATUS_COLORS,
  ValidationError,
  WRIST_OFF_ALERT_MINS,
  apiFetch,
  canViewBAC,
  confirmForgotPassword,
  confirmSignUp,
  createOfficer,
  deactivateOfficer,
  deriveSubjectStatus,
  enrollSubject,
  forgotPassword,
  formatBac,
  formatDate,
  formatDateTime,
  formatTime,
  getAdminSubjects,
  getAlerts,
  getBacColor,
  getCognitoConfig,
  getDeviceHistory,
  getDevices,
  getLatestReading,
  getMapSubjects,
  getMe,
  getOfficerSubjects,
  getOfficers,
  getOrgSettings,
  getReadingResult,
  getSubjectDetail,
  getSubjectEvents,
  getSubjectReadings,
  getSubjectSummary,
  getSubjectTrailStats,
  getSubjects,
  initApiClient,
  isBacAboveThreshold,
  isCompliant,
  isWithinMinutes,
  minutesAgo,
  postEvent,
  postEventBatch,
  postReading,
  readingsToGeoJSON,
  readingsToTrailLine,
  refreshToken,
  requiresAttention,
  signIn,
  signOut,
  signUp,
  timeAgo,
  updateDeviceStatus,
  updateOrgSettings
};
//# sourceMappingURL=index.mjs.map