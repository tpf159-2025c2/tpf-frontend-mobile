import { API_URL } from "./config";
import authService from "./authService";
import {
  House,
  CreateHouseData,
  UpdateHouseData,
  Sensor,
  CreateSensorData,
  UpdateSensorData,
  Member,
  CreateMemberData,
  UpdateMemberData,
  ReadingsResponse,
} from "./types";

class HouseService {
  async getHouses(): Promise<House[]> {
    const response = await authService.fetchWithAuth(`${API_URL}/households`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al obtener casas");
    }

    const data = await response.json();
    return data.households;
  }

  async getHouse(id: string): Promise<House> {
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/${id}`,
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al obtener la casa");
    }

    return response.json();
  }

  async createHouse(houseData: CreateHouseData): Promise<House> {
    const response = await authService.fetchWithAuth(`${API_URL}/households`, {
      method: "POST",
      body: JSON.stringify(houseData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al crear casa");
    }

    return response.json();
  }

  async updateHouse(id: string, houseData: UpdateHouseData): Promise<House> {
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(houseData),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al actualizar la casa");
    }

    return response.json();
  }

  async deleteHouse(id: string): Promise<void> {
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/${id}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al eliminar la casa");
    }
  }

  async searchHouse(address: string): Promise<House[]> {
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/lookup?address=${encodeURIComponent(address)}`,
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al buscar la casa");
    }

    return response.json();
  }

  async getSensors(houseId: string): Promise<Sensor[]> {
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/${houseId}/sensors`,
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al obtener sensores");
    }

    const data = await response.json();
    return data.sensors;
  }

  async getSensor(houseId: string, sensorId: string): Promise<Sensor> {
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/${houseId}/sensors/${sensorId}`,
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al obtener el sensor");
    }

    return response.json();
  }

  async createSensor(
    houseId: string,
    sensorData: CreateSensorData,
  ): Promise<Sensor> {
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/${houseId}/sensors`,
      {
        method: "POST",
        body: JSON.stringify(sensorData),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al crear sensor");
    }

    return response.json();
  }

  async updateSensor(
    houseId: string,
    sensorId: string,
    sensorData: UpdateSensorData,
  ): Promise<Sensor> {
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/${houseId}/sensors/${sensorId}`,
      {
        method: "PATCH",
        body: JSON.stringify(sensorData),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al actualizar el sensor");
    }

    return response.json();
  }

  async deleteSensor(houseId: string, sensorId: string): Promise<void> {
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/${houseId}/sensors/${sensorId}`,
      { method: "DELETE" },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al eliminar el sensor");
    }
  }

  async acceptSensor(houseId: string, sensorId: string): Promise<Sensor> {
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/${houseId}/sensors/${sensorId}/accept`,
      { method: "POST" },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al aceptar el sensor");
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

    const response = await authService.fetchWithAuth(
      `${API_URL}/households/${houseId}/sensors/${sensorId}/readings${query}`,
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al obtener lecturas del sensor");
    }

    return response.json();
  }

  async getMembers(houseId: string): Promise<Member[]> {
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/${houseId}/members`,
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al obtener miembros");
    }

    const data = await response.json();
    return data.members;
  }

  async createMember(houseId: string, data: CreateMemberData): Promise<Member> {
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/${houseId}/members`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al agregar miembro");
    }

    return response.json();
  }

  async updateMember(
    houseId: string,
    memberId: string,
    data: UpdateMemberData,
  ): Promise<Member> {
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/${houseId}/members/${memberId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al actualizar miembro");
    }

    return response.json();
  }

  async deleteMember(houseId: string, memberId: string): Promise<void> {
    const response = await authService.fetchWithAuth(
      `${API_URL}/households/${houseId}/members/${memberId}`,
      { method: "DELETE" },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al eliminar miembro");
    }
  }
}

export default new HouseService();
