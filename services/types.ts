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

export type SensorType = 'MOTION' | 'MAGNETIC' | 'GAS' | 'SOUND';
export type SensorStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export const SENSOR_TYPE_LABELS: Record<SensorType, string> = {
  MOTION: 'Movimiento',
  MAGNETIC: 'Magnetico',
  GAS: 'Gas',
  SOUND: 'Sonido',
};

export const SENSOR_STATUS_LABELS: Record<SensorStatus, string> = {
  ACCEPTED: 'Aceptado',
  PENDING: 'Pendiente',
  REJECTED: 'Rechazado',
};

export const SENSOR_STATUS_COLORS: Record<SensorStatus, string> = {
  ACCEPTED: '#28a745',
  PENDING: '#ffc107',
  REJECTED: '#dc3545',
};

export const SENSOR_ICONS: Record<SensorType, string> = {
  MOTION: 'eye',
  MAGNETIC: 'door',
  GAS: 'gas-cylinder',
  SOUND: 'volume-high',
};

export interface Sensor {
  id: string;
  name: string;
  type: SensorType;
  status: SensorStatus;
  hardwareId: string;
  location?: string;
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

export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type MemberStatus = 'ACTIVE' | 'PENDING' | 'INACTIVE';

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  MEMBER: 'Miembro',
};

export interface Member {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
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
