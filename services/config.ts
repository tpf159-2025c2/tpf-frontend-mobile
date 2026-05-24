export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
export const API_URL_V2 = API_URL.replace(/\/v1(\/?$)/, '/v2$1');
