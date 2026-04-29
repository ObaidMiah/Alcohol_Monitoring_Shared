import type {
  AdminDeviceListItem,
  AdminOfficerListItem,
  AdminSubjectListItem,
  CreateOfficerPayload,
  DeviceHistoryItem,
  EnrollSubjectPayload,
  OrgSettings,
  SubjectListItem,
  UpdateDeviceStatusPayload,
  UpdateOrgSettingsPayload,
} from "../types";
import { apiFetch } from "./client";

// ── Org settings ────────────────────────────────────────────────

export async function getOrgSettings(): Promise<OrgSettings> {
  return apiFetch<OrgSettings>("/v1/admin/settings");
}

export async function updateOrgSettings(
  payload: UpdateOrgSettingsPayload,
): Promise<OrgSettings> {
  return apiFetch<OrgSettings>("/v1/admin/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// ── Officers ────────────────────────────────────────────────────

export async function getOfficers(
  fields?: string,
): Promise<AdminOfficerListItem[]> {
  const qs = fields ? `?fields=${fields}` : "";
  return apiFetch<AdminOfficerListItem[]>(`/v1/admin/officers${qs}`);
}

export async function createOfficer(
  payload: CreateOfficerPayload,
): Promise<AdminOfficerListItem> {
  return apiFetch<AdminOfficerListItem>("/v1/admin/officers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deactivateOfficer(
  officerId: string,
): Promise<{ id: string; isActive: boolean }> {
  return apiFetch<{ id: string; isActive: boolean }>(
    `/v1/admin/officers/${officerId}/deactivate`,
    { method: "POST" },
  );
}

export async function getOfficerSubjects(
  officerId: string,
): Promise<SubjectListItem[]> {
  return apiFetch<SubjectListItem[]>(
    `/v1/admin/officers/${officerId}/subjects`,
  );
}

// ── Subjects ────────────────────────────────────────────────────

export async function getAdminSubjects(): Promise<AdminSubjectListItem[]> {
  return apiFetch<AdminSubjectListItem[]>("/v1/admin/subjects");
}

export async function enrollSubject(
  payload: EnrollSubjectPayload,
): Promise<{ id: string }> {
  return apiFetch<{ id: string }>("/v1/admin/subjects/enroll", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ── Devices ─────────────────────────────────────────────────────

export async function getDevices(
  status?: string,
): Promise<AdminDeviceListItem[]> {
  const qs = status ? `?status=${status}` : "";
  return apiFetch<AdminDeviceListItem[]>(`/v1/admin/devices${qs}`);
}

export async function getDeviceHistory(
  deviceId: string,
): Promise<DeviceHistoryItem[]> {
  return apiFetch<DeviceHistoryItem[]>(
    `/v1/admin/devices/${deviceId}/history`,
  );
}

export async function updateDeviceStatus(
  deviceId: string,
  payload: UpdateDeviceStatusPayload,
): Promise<{ id: string; status: string }> {
  return apiFetch<{ id: string; status: string }>(
    `/v1/admin/devices/${deviceId}/status`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}
