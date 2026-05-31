import { useEffect, useRef } from 'react';
import type * as NotificationsType from 'expo-notifications';
import * as Device from 'expo-device';
import {
  isExpoGo,
  requestPermissions,
  getExpoPushToken,
  addForegroundListener,
  addResponseListener,
} from '@/services/notificationService';
import userService from '@/services/userService';
import useAuthStore from '@/hooks/useAuthStore';

export function useNotifications() {
  const user = useAuthStore((state) => state.user);
  const foregroundSub = useRef<NotificationsType.Subscription | null>(null);
  const responseSub = useRef<NotificationsType.Subscription | null>(null);

  useEffect(() => {
    if (isExpoGo) return;

    foregroundSub.current = addForegroundListener((notification) => {
      console.log('[useNotifications] Notificación recibida:', notification);
    });

    responseSub.current = addResponseListener((response) => {
      console.log('[useNotifications] Usuario tocó notificación:', response);
    });

    return () => {
      foregroundSub.current?.remove();
      responseSub.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!user || isExpoGo) return;

    const userId = user.id;

    async function registerToken() {
      if (!Device.isDevice) {
        console.log('[useNotifications] Push notifications requieren dispositivo físico');
        return;
      }
      const granted = await requestPermissions();
      if (!granted) {
        console.warn('[useNotifications] Permisos de notificación denegados');
        return;
      }
      const token = await getExpoPushToken();
      if (token) {
        console.log('[useNotifications] Push token:', token);
        try {
          await userService.registerPushToken(userId, token);
          console.log('[useNotifications] Token registrado en el backend');
        } catch (err) {
          console.error('[useNotifications] Error al registrar token:', err);
        }
      }
    }

    registerToken();

    return () => {
      userService.registerPushToken(userId, null).catch(() => {});
    };
  }, [user]);
}
