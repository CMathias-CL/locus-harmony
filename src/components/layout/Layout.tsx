import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <header className="bg-background border-b px-6 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Sistema de Reservas</h1>
          <NotificationDropdown />
        </header>
        <div className="pt-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}