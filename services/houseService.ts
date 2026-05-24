import { API_URL, API_URL_V2 } from "./config";
import authService from "./authService";
import {
  House,
  CreateHouseData,
  UpdateHouseData,
  Sensor,
  SensorResponse,
  CreateSensorData,
  UpdateSensorData,
  Member,
  CreateMemberData,
  UpdateMemberData,
  ReadingsResponse,
  UpdateSensorNotificationPreferencesData,
  SensorNotificationPreferencesResponse,
} from "./types";

const log = (method: string, detail?: string) => {
  console.log(`[HouseService] ${method}${detail ? ` (${detail})` : ""}`);
};

const logError = (method: string, status: number, body: unknown, detail?: string) => {
  console.error(
    `[HouseService] ${method}${detail ? ` (${detail})` : ""} → ${status}`,
    JSON.stringify(body, null, 2),
  );
};

class HouseService {
  async getHouses(): Promise<House[]> {
    log("getHouses");
    const response = await authService.fetchWithAuth(`${API_URL}/households`);

    if (!response.ok) {
      const body = await response.json();
      logError("getHouses", response.status, body);
      throw new Error(body.message || "Error al obtener casas");
    }

    const data = await response.json();
    log("getHouses", `${data.households.length} casas`);
    return data.households;
  }

  async getHouse(id: string): Promise<House> {
    log("getHouse", id);
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/${id}`,
    );

    if (!response.ok) {
      const body = await response.json();
      logError("getHouse", response.status, body, id);
      throw new Error(body.message || "Error al obtener la casa");
    }

    const data = await response.json();
    return data.household ?? data;
  }

  async createHouse(houseData: CreateHouseData): Promise<House> {
    log("createHouse", houseData.name);
    const response = await authService.fetchWithAuth(`${API_URL}/households`, {
      method: "POST",
      body: JSON.stringify(houseData),
    });

    if (!response.ok) {
      const body = await response.json();
      logError("createHouse", response.status, body, houseData.name);
      throw new Error(body.message || "Error al crear casa");
    }

    return response.json();
  }

  async updateHouse(id: string, houseData: UpdateHouseData): Promise<House> {
    log("updateHouse", id);
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(houseData),
      },
    );

    if (!response.ok) {
      const body = await response.json();
      logError("updateHouse", response.status, body, id);
      throw new Error(body.message || "Error al actualizar la casa");
    }

    return response.json();
  }

  async deleteHouse(id: string): Promise<void> {
    log("deleteHouse", id);
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/${id}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      const body = await response.json();
      logError("deleteHouse", response.status, body, id);
      throw new Error(body.message || "Error al eliminar la casa");
    }

    log("deleteHouse", `${id} deleted`);
  }

  async searchHouse(address: string): Promise<House[]> {
    log("searchHouse", address);
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/lookup?address=${encodeURIComponent(address)}`,
    );

    if (!response.ok) {
      const body = await response.json();
      logError("searchHouse", response.status, body, address);
      throw new Error(body.message || "Error al buscar la casa");
    }

    return response.json();
  }

  async getSensors(houseId: string): Promise<Sensor[]> {
    log("getSensors", `house=${houseId}`);
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/${houseId}/sensors`,
    );

    if (!response.ok) {
      const body = await response.json();
      logError("getSensors", response.status, body, `house=${houseId}`);
      throw new Error(body.message || "Error al obtener sensores");
    }

    const data = await response.json();
    log("getSensors", `house=${houseId} → ${data.sensors.length} sensores`);
    return data.sensors;
  }

  async getSensor(houseId: string, sensorId: string): Promise<Sensor> {
    log("getSensor", `house=${houseId} sensor=${sensorId}`);
    const response = await authService.fetchWithAuth(
      `${API_URL_V2}/households/${houseId}/sensors/${sensorId}`,
    );

    if (!response.ok) {
      const body = await response.json();
      logError("getSensor", response.status, body, `house=${houseId} sensor=${sensorId}`);
      throw new Error(body.message || "Error al obtener el sensor");
    }

    const sensorData: SensorResponse = await response.json();
    return sensorData.sensor;
  }

  async updateSensorNotificationPreferences(
    houseId: string,
    sensorId: string,
    data: UpdateSensorNotificationPreferencesData,
  ): Promise<SensorNotificationPreferencesResponse["preference"]> {
    log(
      "updateSensorNotificationPreferences",
      `house=${houseId} sensor=${sensorId} rules=${data.rules.length}`,
    );
    const response = await authService.fetchWithAuth(
      `${API_URL_V2}/households/${houseId}/sensors/${sensorId}/notification-preferences`,
      { method: "PUT", body: JSON.stringify(data) },
    );

    if (!response.ok) {
      const body = await response.json();
      logError(
        "updateSensorNotificationPreferences",
        response.status,
        body,
        `house=${houseId} sensor=${sensorId}`,
      );
      throw new Error(body.message || "Error al actualizar las preferencias del sensor");
    }

    const json: SensorNotificationPreferencesResponse = await response.json();
    return json.preference;
  }

  async createSensor(
    houseId: string,
    sensorData: CreateSensorData,
  ): Promise<Sensor> {
    log("createSensor", `house=${houseId} name=${sensorData.name}`);
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/${houseId}/sensors`,
      {
        method: "POST",
        body: JSON.stringify(sensorData),
      },
    );

    if (!response.ok) {
      const body = await response.json();
      logError("createSensor", response.status, body, `house=${houseId}`);
      throw new Error(body.message || "Error al crear sensor");
    }

    return response.json();
  }

  async updateSensor(
    houseId: string,
    sensorId: string,
    sensorData: UpdateSensorData,
  ): Promise<Sensor> {
    log("updateSensor", `house=${houseId} sensor=${sensorId}`);
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/${houseId}/sensors/${sensorId}`,
      {
        method: "PATCH",
        body: JSON.stringify(sensorData),
      },
    );

    if (!response.ok) {
      const body = await response.json();
      logError("updateSensor", response.status, body, `house=${houseId} sensor=${sensorId}`);
      throw new Error(body.message || "Error al actualizar el sensor");
    }

    return response.json();
  }

  async deleteSensor(houseId: string, sensorId: string): Promise<void> {
    log("deleteSensor", `house=${houseId} sensor=${sensorId}`);
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/${houseId}/sensors/${sensorId}`,
      { method: "DELETE" },
    );

    if (!response.ok) {
      const body = await response.json();
      logError("deleteSensor", response.status, body, `house=${houseId} sensor=${sensorId}`);
      throw new Error(body.message || "Error al eliminar el sensor");
    }

    log("deleteSensor", `sensor=${sensorId} deleted`);
  }

  async acceptSensor(houseId: string, sensorId: string): Promise<Sensor> {
    log("acceptSensor", `house=${houseId} sensor=${sensorId}`);
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/${houseId}/sensors/${sensorId}/accept`,
      { method: "POST" },
    );

    if (!response.ok) {
      const body = await response.json();
      logError("acceptSensor", response.status, body, `house=${houseId} sensor=${sensorId}`);
      throw new Error(body.message || "Error al aceptar el sensor");
    }

    return response.json();
  }

  async getSensorMetrics(
    houseId: string,
    sensorId: string,
    params: { from?: string; to?: string } = {},
  ): Promise<ReadingsResponse> {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.append("from", params.from);
    if (params.to) searchParams.append("to", params.to);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";

    log("getSensorMetrics", `house=${houseId} sensor=${sensorId}${query ? " " + query : ""}`);
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/${houseId}/sensors/${sensorId}/readings${query}`,
    );

    if (!response.ok) {
      const body = await response.json();
      logError("getSensorMetrics", response.status, body, `house=${houseId} sensor=${sensorId}`);
      throw new Error(body.message || "Error al obtener lecturas del sensor");
    }

    const data: ReadingsResponse = await response.json();
    log("getSensorMetrics", `sensor=${sensorId} → ${data.readings.length} lecturas`);
    return data;
  }

  async getMembers(houseId: string): Promise<Member[]> {
    log("getMembers", `house=${houseId}`);
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/${houseId}/members`,
    );

    if (!response.ok) {
      const body = await response.json();
      logError("getMembers", response.status, body, `house=${houseId}`);
      throw new Error(body.message || "Error al obtener miembros");
    }

    const data = await response.json();
    log("getMembers", `house=${houseId} → ${data.members.length} miembros`);
    return data.members;
  }

  async createMember(houseId: string, data: CreateMemberData): Promise<Member> {
    log("createMember", `house=${houseId} email=${data.email}`);
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/${houseId}/members`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      const body = await response.json();
      logError("createMember", response.status, body, `house=${houseId}`);
      throw new Error(body.message || "Error al agregar miembro");
    }

    return response.json();
  }

  async updateMember(
    houseId: string,
    memberId: string,
    data: UpdateMemberData,
  ): Promise<Member> {
    log("updateMember", `house=${houseId} member=${memberId}`);
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/${houseId}/members/${memberId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      const body = await response.json();
      logError("updateMember", response.status, body, `house=${houseId} member=${memberId}`);
      throw new Error(body.message || "Error al actualizar miembro");
    }

    return response.json();
  }

  async deleteMember(houseId: string, memberId: string): Promise<void> {
    log("deleteMember", `house=${houseId} member=${memberId}`);
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/${houseId}/members/${memberId}`,
      { method: "DELETE" },
    );

    if (!response.ok) {
      const body = await response.json();
      logError("deleteMember", response.status, body, `house=${houseId} member=${memberId}`);
      throw new Error(body.message || "Error al eliminar miembro");
    }

    log("deleteMember", `member=${memberId} deleted`);
  }

  async getPairRequests(houseId: string): Promise<Sensor[]> {
    log("getPairRequests", `house=${houseId}`);
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/${houseId}/pair-requests`,
    );

    if (!response.ok) {
      const body = await response.json();
      logError("getPairRequests", response.status, body, `house=${houseId}`);
      throw new Error(body.message || "Error al obtener solicitudes de emparejamiento");
    }

    const data = await response.json();
    log("getPairRequests", `house=${houseId} → ${data.sensors.length} sensores`);
    return data.sensors;
  }
}

export default new HouseService();
