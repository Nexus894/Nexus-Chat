/**
 * AuthContext
 * Global auth state: user, login, logout, loading
 */

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while checking session

  // ── Apply theme from user preferences ──────────────────
  const applyTheme = useCallback((theme) => {
    if (!theme) return;
    document.documentElement.setAttribute("data-theme", theme.preset || "nebula");
    if (theme.customAccent) {
      document.documentElement.style.setProperty("--accent", theme.customAccent);
    }
  }, []);

  // ── Load session on mount ───────────────────────────────
  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = localStorage.getItem("nexus_token");
        if (!token) return;

        const { data } = await authAPI.getMe();
        setUser(data.user);
        applyTheme(data.user.theme);
        connectSocket(token);
      } catch {
        localStorage.removeItem("nexus_token");
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [applyTheme]);

  // ── Login ───────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem("nexus_token", data.token);
    setUser(data.user);
    applyTheme(data.user.theme);
    connectSocket(data.token);
    return data.user;
  }, [applyTheme]);

  // ── Signup ──────────────────────────────────────────────
  const signup = useCallback(async (formData) => {
    const { data } = await authAPI.signup(formData);
    localStorage.setItem("nexus_token", data.token);
    setUser(data.user);
    applyTheme(data.user.theme);
    connectSocket(data.token);
    return data.user;
  }, [applyTheme]);

  // ── Logout ──────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.removeItem("nexus_token");
    disconnectSocket();
    setUser(null);
    document.documentElement.removeAttribute("data-theme");
  }, []);

  // ── Update user state locally (after profile edit etc.) ──
  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      if (updates.theme) applyTheme(updates.theme);
      return updated;
    });
  }, [applyTheme]);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
