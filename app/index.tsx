import { Redirect } from "expo-router";
import useAuthStore from "@/hooks/useAuthStore";

export default function Index() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loading = useAuthStore((state) => state.loading);
  const hydrated = useAuthStore((state) => state.hydrated);

  if (!hydrated || loading) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href="/(protected)/(tabs)/houses" />;
  }

  return <Redirect href="/login" />;
}
