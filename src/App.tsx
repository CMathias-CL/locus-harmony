import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Rooms from "./pages/Rooms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="users" element={<div className="p-6"><h1 className="text-3xl font-bold">Usuarios</h1><p className="text-muted-foreground">Próximamente...</p></div>} />
            <Route path="reports" element={<div className="p-6"><h1 className="text-3xl font-bold">Reportes</h1><p className="text-muted-foreground">Próximamente...</p></div>} />
            <Route path="settings" element={<div className="p-6"><h1 className="text-3xl font-bold">Configuración</h1><p className="text-muted-foreground">Próximamente...</p></div>} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
