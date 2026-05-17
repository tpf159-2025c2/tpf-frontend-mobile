import { Redirect } from "expo-router";
import useAuthStore from "@/hooks/useAuthStore";

export default function Index() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Redirect href="/(protected)/(tabs)/houses" />;
  }

  return <Redirect href="/login" />;
}
