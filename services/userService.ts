import { API_URL } from "./config";
import authService from "./authService";
import {
  NotificationPreferences,
  SensorPreference,
  SensorPreferencesResponse,
} from "./types";

const log = (method: string, detail?: string) => {
  console.log(`[UserService] ${method}${detail ? ` (${detail})` : ""}`);
};

const logError = (method: string, status: number, body: unknown, detail?: string) => {
  console.error(
    `[UserService] ${method}${detail ? ` (${detail})` : ""} → ${status}`,
    JSON.stringify(body, null, 2),
  );
};

class UserService {
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    log("getNotificationPreferences", `user=${userId}`);
    const response = await authService.fetchWithAuth(
      `${API_URL}/users/${userId}/notification-preferences`,
    );

    if (!response.ok) {
      const body = await response.json();
      logError("getNotificationPreferences", response.status, body, `user=${userId}`);
      throw new Error(body.message || "Error al obtener preferencias de notificación");
    }

    const data: NotificationPreferences = await response.json();
    log("getNotificationPreferences", `user=${userId} → mobile=${data.mobile} email=${data.email}`);
    return data;
  }

  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    log("updateNotificationPreferences", `user=${userId} ${JSON.stringify(preferences)}`);
    const response = await authService.fetchWithAuth(
      `${API_URL}/users/${userId}/notification-preferences`,
      { method: "PATCH", body: JSON.stringify(preferences) },
    );

    if (!response.ok) {
      const body = await response.json();
      logError("updateNotificationPreferences", response.status, body, `user=${userId}`);
      throw new Error(body.message || "Error al actualizar preferencias de notificación");
    }

    return response.json();
  }

  async getSensorPreferences(
    userId: string,
    householdId: string,
  ): Promise<SensorPreferencesResponse> {
    log("getSensorPreferences", `user=${userId} house=${householdId}`);
    const response = await authService.fetchWithAuth(
      `${API_URL}/users/${userId}/sensor-preferences?householdId=${householdId}`,
    );

    if (!response.ok) {
      const body = await response.json();
      logError("getSensorPreferences", response.status, body, `user=${userId} house=${householdId}`);
      throw new Error(body.message || "Error al obtener preferencias de sensores");
    }

    const data: SensorPreferencesResponse = await response.json();
    log("getSensorPreferences", `user=${userId} → ${data.preferences.length} preferencias`);
    return data;
  }

  async updateSensorPreference(
    userId: string,
    sensorId: string,
    preference: Omit<SensorPreference, "sensorId">,
  ): Promise<SensorPreference> {
    log("updateSensorPreference", `user=${userId} sensor=${sensorId}`);
    const response = await authService.fetchWithAuth(
      `${API_URL}/users/${userId}/sensor-preferences/${sensorId}`,
      { method: "PUT", body: JSON.stringify(preference) },
    );

    if (!response.ok) {
      const body = await response.json();
      logError("updateSensorPreference", response.status, body, `user=${userId} sensor=${sensorId}`);
      throw new Error(body.message || "Error al actualizar preferencia del sensor");
    }

    return response.json();
  }
}

export default new UserService();
