import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

const INTERNAL_PASSWORD = "padel2025";

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "1"
  );

  const login = useCallback((password) => {
    if (password === INTERNAL_PASSWORD) {
      localStorage.setItem("isLoggedIn", "1");
      setIsLoggedIn(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
