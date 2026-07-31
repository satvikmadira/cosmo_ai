import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("cosmo_access_token")) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username_or_email, password) => {
    const { data } = await api.post("/auth/login", { username_or_email, password });
    localStorage.setItem("cosmo_access_token", data.access_token);
    localStorage.setItem("cosmo_refresh_token", data.refresh_token);
    await loadProfile();
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("cosmo_access_token", data.access_token);
    localStorage.setItem("cosmo_refresh_token", data.refresh_token);
    await loadProfile();
  };

  const logout = () => {
    localStorage.removeItem("cosmo_access_token");
    localStorage.removeItem("cosmo_refresh_token");
    setUser(null);
  };

  const refreshProfile = loadProfile;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
