import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import NuevoPartido from "./pages/NuevoPartido.jsx";
import ControlPartido from "./pages/ControlPartido.jsx";
import Tablero from "./pages/Tablero.jsx";
import TableroIndex from "./pages/TableroIndex.jsx";
import Publicidad from "./pages/Publicidad.jsx";

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/nuevo-partido" element={<ProtectedRoute><NuevoPartido /></ProtectedRoute>} />
      <Route path="/control/:id" element={<ProtectedRoute><ControlPartido /></ProtectedRoute>} />
      <Route path="/control" element={<Navigate to="/" replace />} />
      <Route path="/publicidad" element={<ProtectedRoute><Publicidad /></ProtectedRoute>} />
      <Route path="/tablero/:codigo" element={<Tablero />} />
      <Route path="/tablero" element={<TableroIndex />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
