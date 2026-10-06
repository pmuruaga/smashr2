import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { api, TOKEN_KEY } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
  }, []);

  const login = useCallback(async (password) => {
    const res = await api.login(password);
    localStorage.setItem(TOKEN_KEY, res.token);
    setIsLoggedIn(true);
  }, []);

  useEffect(() => {
    window.addEventListener("smashr:unauthorized", logout);
    return () => window.removeEventListener("smashr:unauthorized", logout);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
