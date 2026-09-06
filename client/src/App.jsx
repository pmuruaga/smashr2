import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import NuevoPartido from "./pages/NuevoPartido.jsx";
import ControlPartido from "./pages/ControlPartido.jsx";
import Tablero from "./pages/Tablero.jsx";

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/nuevo-partido" element={<ProtectedRoute><NuevoPartido /></ProtectedRoute>} />
      <Route path="/control" element={<ProtectedRoute><ControlPartido /></ProtectedRoute>} />
      <Route path="/tablero" element={<Tablero />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
