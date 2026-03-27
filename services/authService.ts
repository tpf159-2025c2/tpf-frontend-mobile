import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config';
import { Credentials, RegisterData, AuthResponse } from './types';
import { router } from 'expo-router';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_ID_KEY = 'user_id';

class AuthService {
  async login(credentials: Credentials): Promise<AuthResponse> {

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al iniciar sesion');
    }

    const data: AuthResponse = await response.json();
    await this.setAccessToken(data.tokens.accessToken);
    await this.setRefreshToken(data.tokens.refreshToken);
    await this.setUserId(data.user.id);

    return data;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {

    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al registrar usuario');
    }

    const data: AuthResponse = await response.json();
    await this.setAccessToken(data.tokens.accessToken);
    await this.setRefreshToken(data.tokens.refreshToken);
    await this.setUserId(data.user.id);

    return data;
  }

  async logout(): Promise<void> {

    try {
      const accessToken = await this.getAccessToken();
      const refreshToken = await this.getRefreshToken();

      if (accessToken) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
      throw new Error('No hay refresh token');
    }


    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al refrescar token');
    }

    const data = await response.json();
    await this.setAccessToken(data.accessToken);
    await this.setRefreshToken(data.refreshToken);

    return data.accessToken;
  }

  async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const makeRequest = async (token: string | null) => {
      return fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      });
    };

    let response = await makeRequest(await this.getAccessToken());

    if (response.status === 401) {
      try {
        const newToken = await this.refresh();
        response = await makeRequest(newToken);
      } catch {
        await this.clearAuth();
        router.replace('/login');
        throw new Error('Sesion expirada');
      }
    }

    if (response.status === 403) {
      router.replace('/(protected)/(tabs)/houses');
      throw new Error('Sin permisos');
    }

    if (response.status === 404) {
      router.replace('/(protected)/(tabs)/houses');
      throw new Error('Recurso no encontrado');
    }

    return response;
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }

  async clearAuth(): Promise<void> {
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_ID_KEY]);
  }
}

export default new AuthService();
