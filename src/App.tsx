import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Faculties from "./pages/Faculties";
import Rooms from "./pages/Rooms";
import Courses from "./pages/Courses";
import Professors from "./pages/Professors";
import AcademicPeriods from "./pages/AcademicPeriods";
import CleaningReports from "./pages/CleaningReports";
import Users from "./pages/Users";
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
            <Route path="faculties" element={<Faculties />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="courses" element={<Courses />} />
            <Route path="professors" element={<Professors />} />
            <Route path="academic-periods" element={<AcademicPeriods />} />
            <Route path="users" element={<Users />} />
            <Route path="reports" element={<div className="p-6"><h1 className="text-3xl font-bold">Reportes</h1><p className="text-muted-foreground">Próximamente...</p></div>} />
            <Route path="cleaning-reports" element={<CleaningReports />} />
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
