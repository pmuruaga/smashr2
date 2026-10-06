import { useAuth } from "../context/AuthContext.jsx";
import { LayoutGrid, LogOut, Megaphone } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

function NavItem({ to, icon: Icon, children }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition ${
          isActive ? "bg-[#1a241c] text-white" : "text-[#3d4f40] hover:bg-[#eef3ea]"
        }`
      }
    >
      <Icon size={16} />
      <span className="hidden sm:inline">{children}</span>
    </NavLink>
  );
}

export default function AppShell({ children, title, actions, showLogout = true, wide = false }) {
  const { logout, isLoggedIn } = useAuth();
  const width = wide ? "max-w-7xl" : "max-w-5xl";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#eef3ea", color: "#1a241c" }}>
      <header
        className="sticky top-0 z-20"
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #c5d0bc",
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <div className={`mx-auto flex ${width} items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-6`}>
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <img
              src="/assets/icono.webp"
              alt="SMASHR"
              className="h-8 w-8 rounded-full sm:h-9 sm:w-9"
              style={{ boxShadow: "0 0 0 1px #c5d0bc" }}
            />
            <span className="hidden text-lg font-bold tracking-wide min-[380px]:inline sm:text-xl">
              SMASHR
            </span>
          </Link>
          {isLoggedIn && (
            <nav className="flex items-center gap-1">
              <NavItem to="/" icon={LayoutGrid}>Partidos</NavItem>
              <NavItem to="/publicidad" icon={Megaphone}>Publicidad</NavItem>
            </nav>
          )}
          {title ? (
            <h1 className="hidden min-w-0 flex-1 truncate text-sm text-[#3d4f40] md:block">{title}</h1>
          ) : (
            <div className="hidden flex-1 md:block" />
          )}
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {actions}
            {showLogout && isLoggedIn && (
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-[#3d4f40] transition hover:bg-[#eef3ea]"
                title="Salir"
              >
                <LogOut size={16} />
                <span className="hidden lg:inline">Salir</span>
              </button>
            )}
          </div>
        </div>
      </header>
      <main
        className={`mx-auto w-full ${width} px-3 py-5 sm:px-6 sm:py-8`}
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        {children}
      </main>
    </div>
  );
}
