import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "./config";
import { Credentials, RegisterData, AuthResponse } from "./types";
import { router } from "expo-router";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_ID_KEY = "user_id";

const log = (method: string, url: string, status?: number) => {
  if (status !== undefined) {
    console.log(`[API] ${method} ${url} → ${status}`);
  } else {
    console.log(`[API] ${method} ${url}`);
  }
};

const logError = (method: string, url: string, status: number, body: unknown) => {
  console.error(
    `[API] ${method} ${url} → ${status}`,
    JSON.stringify(body, null, 2),
  );
};

class AuthService {
  async login(credentials: Credentials): Promise<AuthResponse> {
    const url = `${API_URL}/auth/login`;
    log("POST", url);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    log("POST", url, response.status);
    if (!response.ok) {
      const body = await response.json();
      logError("POST", url, response.status, body);
      throw new Error(body.message || "Error al iniciar sesion");
    }

    const data: AuthResponse = await response.json();
    await this.setAccessToken(data.tokens.accessToken);
    await this.setRefreshToken(data.tokens.refreshToken);
    await this.setUserId(data.user.id);

    return data;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const url = `${API_URL}/auth/register`;
    log("POST", url);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    log("POST", url, response.status);
    if (!response.ok) {
      const body = await response.json();
      logError("POST", url, response.status, body);
      throw new Error(body.message || "Error al registrar usuario");
    }

    const data: AuthResponse = await response.json();
    await this.setAccessToken(data.tokens.accessToken);
    await this.setRefreshToken(data.tokens.refreshToken);
    await this.setUserId(data.user.id);

    return data;
  }

  async logout(): Promise<void> {
    const url = `${API_URL}/auth/logout`;
    try {
      const accessToken = await this.getAccessToken();
      const refreshToken = await this.getRefreshToken();

      if (accessToken) {
        log("POST", url);
        await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } finally {
      await this.clearAuth();
    }
  }

  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  }

  async setAccessToken(token: string): Promise<void> {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  }

  async setRefreshToken(token: string): Promise<void> {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  async getUserId(): Promise<string | null> {
    return AsyncStorage.getItem(USER_ID_KEY);
  }

  async setUserId(userId: string): Promise<void> {
    await AsyncStorage.setItem(USER_ID_KEY, userId);
  }

  async refresh(): Promise<string> {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No hay refresh token");
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al refrescar token");
    }

    const data = await response.json();
    await this.setAccessToken(data.accessToken);
    await this.setRefreshToken(data.refreshToken);

    return data.accessToken;
  }

  async fetchWithAuth(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const method = (options.method || "GET").toUpperCase();

    const makeRequest = async (token: string | null) => {
      return fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      });
    };

    log(method, url);
    let response = await makeRequest(await this.getAccessToken());

    if (response.status === 401) {
      log(method, url, 401);
      console.log(`[API] token expired, refreshing…`);
      try {
        const newToken = await this.refresh();
        response = await makeRequest(newToken);
      } catch {
        await this.clearAuth();
        router.replace("/login");
        throw new Error("Sesion expirada");
      }
    }

    log(method, url, response.status);

    if (response.status === 403) {
      logError(method, url, 403, { error: "Sin permisos" });
      router.replace("/(protected)/(tabs)/houses");
      throw new Error("Sin permisos");
    }

    if (response.status === 404) {
      logError(method, url, 404, { error: "Recurso no encontrado" });
      router.replace("/(protected)/(tabs)/houses");
      throw new Error("Recurso no encontrado");
    }

    return response;
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }

  async clearAuth(): Promise<void> {
    await AsyncStorage.multiRemove([
      ACCESS_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      USER_ID_KEY,
    ]);
  }
}

export default new AuthService();
