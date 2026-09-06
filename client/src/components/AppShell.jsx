import { useAuth } from "../context/AuthContext.jsx";
import { LogOut } from "lucide-react";
import { Link } from "react-router-dom";

export default function AppShell({
  children,
  title,
  actions,
  showLogout = true,
}) {
  const { logout } = useAuth();

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#eef3ea", color: "#1a241c" }}
    >
      <header
        className="sticky top-0 z-20"
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #c5d0bc",
          boxShadow: "0 1px 0 rgba(26,36,28,0.04)",
        }}
      >
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5 relative z-10">
            <img
              src="/assets/icono.webp"
              alt="SMASHR"
              className="h-9 w-9 rounded-full"
              style={{ boxShadow: "0 0 0 1px #c5d0bc" }}
            />
            <span
              className="text-lg font-bold tracking-wide sm:text-xl"
              style={{ color: "#1a241c" }}
            >
              SMASHR
            </span>
          </Link>
          {title ? (
            <h1
              className="min-w-0 flex-1 truncate text-sm sm:text-base"
              style={{ color: "#3d4f40" }}
            >
              {title}
            </h1>
          ) : (
            <div className="flex-1" />
          )}
          <div className="relative z-10 flex items-center gap-2 sm:gap-3">
            {actions}
            {showLogout && (
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition"
                style={{ color: "#3d4f40" }}
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Salir</span>
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 [scroll-margin-top:5rem]">
        {children}
      </main>
    </div>
  );
}
