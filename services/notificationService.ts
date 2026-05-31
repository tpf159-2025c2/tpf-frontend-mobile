import Constants from 'expo-constants';
import type * as NotificationsType from 'expo-notifications';

export const isExpoGo = Constants.executionEnvironment === 'storeClient';

let _module: typeof NotificationsType | null = null;
function getModule(): typeof NotificationsType | null {
  if (isExpoGo) return null;
  if (!_module) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _module = require('expo-notifications');
  }
  return _module;
}

(function init() {
  const Notifications = getModule();
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
})();

export async function requestPermissions(): Promise<boolean> {
  const Notifications = getModule();
  if (!Notifications) return false;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getExpoPushToken(): Promise<string | null> {
  const Notifications = getModule();
  if (!Notifications) return null;
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = await Notifications.getExpoPushTokenAsync({
      ...(projectId && { projectId }),
    });
    return token.data;
  } catch (error) {
    console.warn('[NotificationService] No se pudo obtener el push token:', error);
    return null;
  }
}

export function addForegroundListener(
  handler: (notification: NotificationsType.Notification) => void
): NotificationsType.Subscription | null {
  return getModule()?.addNotificationReceivedListener(handler) ?? null;
}

export function addResponseListener(
  handler: (response: NotificationsType.NotificationResponse) => void
): NotificationsType.Subscription | null {
  return getModule()?.addNotificationResponseReceivedListener(handler) ?? null;
}
