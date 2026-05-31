export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export type SensorType = "MOTION" | "MAGNETIC" | "GAS" | "SOUND";
export type SensorStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export const SENSOR_TYPE_LABELS: Record<SensorType, string> = {
  MOTION: "Movimiento",
  MAGNETIC: "Magnetico",
  GAS: "Gas",
  SOUND: "Sonido",
};

export const SENSOR_STATUS_LABELS: Record<SensorStatus, string> = {
  ACCEPTED: "Aceptado",
  PENDING: "Pendiente",
  REJECTED: "Rechazado",
};

export const SENSOR_STATUS_COLORS: Record<SensorStatus, string> = {
  ACCEPTED: "#28a745",
  PENDING: "#ffc107",
  REJECTED: "#dc3545",
};

export const SENSOR_ICONS: Record<SensorType, string> = {
  MOTION: "eye",
  MAGNETIC: "door",
  GAS: "gas-cylinder",
  SOUND: "volume-high",
};

export const SENSOR_TYPE_COLORS: Record<SensorType, string> = {
  MOTION: "#1D9E75",
  MAGNETIC: "#475569",
  GAS: "#EF9F27",
  SOUND: "#334155",
};

export interface SensorResponse {
  sensor: Sensor;
}

export interface SensorNotificationRule {
  id: string;
  threshold: number | null;
  durationSeconds: number | null;
  timeFrom: string | null;
  timeTo: string | null;
}

export interface SensorNotificationPreferences {
  enabled: boolean;
  rules: SensorNotificationRule[];
}

export interface Sensor {
  id: string;
  householdId?: number;
  name: string;
  type: SensorType;
  status: SensorStatus;
  hardwareId: string;
  online?: boolean;
  batteryLevel?: number | null;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
  notificationPreferences?: SensorNotificationPreferences;
}

export interface SensorNotificationRuleInput {
  threshold?: number;
  durationSeconds?: number;
  timeFrom?: string;
  timeTo?: string;
}

export interface UpdateSensorNotificationPreferencesData {
  enabled: boolean;
  rules: SensorNotificationRuleInput[];
}

export interface SensorNotificationPreferencesResponse {
  preference: {
    sensorId: string;
    enabled: boolean;
    rules: SensorNotificationRule[];
  };
}

export interface SensorReading {
  id: string;
  value: string;
  timestamp: string;
}

export interface CreateSensorData {
  name: string;
  type: SensorType;
  hardwareId: string;
  location?: string;
}

export interface UpdateSensorData {
  name?: string;
  type?: SensorType;
  hardwareId?: string;
  location?: string;
}

export type MemberRole = "OWNER" | "ADMIN" | "MEMBER";
export type MemberStatus = "ACTIVE" | "ACCEPTED" | "PENDING" | "INACTIVE";

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  OWNER: "Propietario",
  ADMIN: "Administrador",
  MEMBER: "Miembro",
};

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  ACTIVE: "Activo",
  ACCEPTED: "Aceptado",
  PENDING: "Pendiente",
  INACTIVE: "Inactivo",
};

export const MEMBER_STATUS_COLORS: Record<MemberStatus, string> = {
  ACTIVE: "#28a745",
  ACCEPTED: "#1D9E75",
  PENDING: "#ffc107",
  INACTIVE: "#6c757d",
};

export interface Member {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  createdAt: string;
}

export interface CreateMemberData {
  email: string;
  role: MemberRole;
}

export interface UpdateMemberData {
  role: MemberRole;
}

export interface House {
  id: string;
  name: string;
  address: string;
  lastOnlineAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateHouseData {
  name: string;
  address: string;
}

export interface UpdateHouseData {
  name?: string;
  address?: string;
}

export interface HousesResponse {
  households: House[];
}

export interface SensorsResponse {
  sensors: Sensor[];
}

export interface MembersResponse {
  members: Member[];
}

export interface ReadingsResponse {
  readings: SensorReading[];
}

export interface NotificationPreferences {
  browser: boolean;
  mobile: boolean;
  email: boolean;
}
