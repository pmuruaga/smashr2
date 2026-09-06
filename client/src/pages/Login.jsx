import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Button from "../components/Button.jsx";

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(password)) {
      navigate("/");
    } else {
      setError("Contraseña incorrecta");
      setPassword("");
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: "#eef3ea" }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border-2 p-8 shadow-sm"
        style={{
          backgroundColor: "#ffffff",
          borderColor: "#9aaf90",
          color: "#1a241c",
        }}
      >
        <div className="mb-8 text-center">
          <img
            src="/assets/icono.webp"
            alt="SMASHR"
            className="mx-auto mb-3 h-16 w-16 rounded-full"
            style={{ boxShadow: "0 0 0 2px #c5d0bc" }}
          />
          <h1 className="text-2xl font-bold tracking-wide" style={{ color: "#1a241c" }}>
            SMASHR
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#3d4f40" }}>
            Acceso al control de cancha
          </p>
        </div>
        {error && (
          <p className="mb-3 text-center text-sm" style={{ color: "#c43c2c" }}>
            {error}
          </p>
        )}
        <label
          className="mb-1 block text-xs font-semibold uppercase tracking-wider"
          style={{ color: "#3d4f40" }}
        >
          Contraseña
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          autoComplete="current-password"
          className="ui-field mb-5"
        />
        <Button type="submit" className="w-full">
          Entrar
        </Button>
      </form>
    </div>
  );
}
