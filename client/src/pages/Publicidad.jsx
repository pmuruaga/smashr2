import AppShell from "../components/AppShell.jsx";
import PublicidadPanel from "../components/PublicidadPanel.jsx";

export default function Publicidad() {
  return (
    <AppShell>
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Publicidad</h2>
          <p className="mt-1 text-sm text-[#3d4f40]">
            Banners que rotan debajo del marcador en todos los tableros.
          </p>
        </div>
        <PublicidadPanel />
      </div>
    </AppShell>
  );
}
