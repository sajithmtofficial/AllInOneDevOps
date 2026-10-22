import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getCurrentUsername,
  loginUser,
  logoutUser,
  registerUser,
} from "../services/auth";
import { hasAccessToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => hasAccessToken());
  const [username, setUsername] = useState(() => getCurrentUsername());

  useEffect(() => {
    const handleExpired = () => {
      setToken(false);
      setUsername("");
    };

    window.addEventListener("auth-expired", handleExpired);
    return () => window.removeEventListener("auth-expired", handleExpired);
  }, []);

  const login = useCallback(async (name, password) => {
    const data = await loginUser(name, password);
    setToken(true);
    setUsername(name);
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    return registerUser(name, email, password);
  }, []);

  const logout = useCallback(() => {
    logoutUser();
    setToken(false);
    setUsername("");
  }, []);

  const value = useMemo(
    () => ({ token, username, login, register, logout }),
    [token, username, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
