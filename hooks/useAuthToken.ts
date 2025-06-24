// hooks/useAuthToken.ts
import { useEffect, useState } from "react";
export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const match = document.cookie.match(/token=([^;]+)/);
      setToken(match ? match[1] : null);
    }
  }, []);
  return token;
}
