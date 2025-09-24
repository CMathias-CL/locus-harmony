import { useState, useEffect } from "react";
import {
  Building2,
  Calendar,
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  School,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const [selectedFaculty, setSelectedFaculty] = useState<string>("all");
  const [faculties, setFaculties] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRooms: 0,
    availableRooms: 0,
    todayReservations: 0,
    totalReservations: 0,
    activeProfessors: 0,
    occupancyRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFaculties();
    fetchStats();
  }, [selectedFaculty]);

  const fetchFaculties = async () => {
    try {
      const { data, error } = await supabase
        .from("faculties")
        .select("*")
        .order("name");

      if (error) throw error;
      setFaculties(data || []);
    } catch (error) {
      console.error("Error fetching faculties:", error);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Build query based on faculty filter
      let roomsQuery = supabase.from("rooms").select("*, faculties(name)");
      if (selectedFaculty !== "all") {
        roomsQuery = roomsQuery.eq("faculty_id", selectedFaculty);
      }

      const { data: rooms, error: roomsError } = await roomsQuery;
      if (roomsError) throw roomsError;

      // Get today's reservations
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      let reservationsQuery = supabase
        .from("reservations")
        .select("*, rooms!inner(faculty_id)")
        .gte("start_datetime", startOfDay.toISOString())
        .lt("start_datetime", endOfDay.toISOString());

      if (selectedFaculty !== "all") {
        reservationsQuery = reservationsQuery.eq("rooms.faculty_id", selectedFaculty);
      }

      const { data: todayReservations, error: reservationsError } = await reservationsQuery;
      if (reservationsError) throw reservationsError;

      // Get total reservations count
      let totalReservationsQuery = supabase
        .from("reservations")
        .select("count", { count: 'exact', head: true });

      if (selectedFaculty !== "all") {
        totalReservationsQuery = totalReservationsQuery
          .eq("rooms.faculty_id", selectedFaculty);
      }

      const { count: totalReservations } = await totalReservationsQuery;

      // Get active professors count
      const { data: professors, error: professorsError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "professor");

      if (professorsError) throw professorsError;

      const totalRooms = rooms?.length || 0;
      const availableRooms = rooms?.filter(r => r.status === "available").length || 0;
      const todayReservationsCount = todayReservations?.length || 0;
      const occupancyRate = totalRooms > 0 ? Math.round((todayReservationsCount / totalRooms) * 100) : 0;

      setStats({
        totalRooms,
        availableRooms,
        todayReservations: todayReservationsCount,
        totalReservations: totalReservations || 0,
        activeProfessors: professors?.length || 0,
        occupancyRate
      });

    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido al sistema de gestión académica
          </p>
        </div>
        
        {/* Faculty Filter */}
        <Card className="w-full sm:w-auto">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <School className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por facultad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Facultades</SelectItem>
                  {faculties.map((faculty) => (
                    <SelectItem key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Salas Totales"
          value={loading ? "..." : stats.totalRooms.toString()}
          description={`${stats.totalRooms - stats.availableRooms} no disponibles`}
          icon={Building2}
          trend={{ value: stats.availableRooms, isPositive: true }}
        />
        <MetricCard
          title="Reservas Hoy"
          value={loading ? "..." : stats.todayReservations.toString()}
          description={`de ${stats.totalRooms} salas`}
          icon={Calendar}
          trend={{ value: stats.todayReservations, isPositive: true }}
        />
        <MetricCard
          title="Profesores Activos"
          value={loading ? "..." : stats.activeProfessors.toString()}
          description="en este periodo"
          icon={Users}
          trend={{ value: stats.activeProfessors, isPositive: true }}
        />
        <MetricCard
          title="Tasa de Ocupación"
          value={loading ? "..." : `${stats.occupancyRate}%`}
          description="hoy"
          icon={TrendingUp}
          trend={{ value: stats.occupancyRate, isPositive: true }}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <QuickActions />
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
      </div>

      {/* Alerts Section */}
      <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <h3 className="font-medium text-warning">Alertas del Sistema</h3>
        </div>
        <p className="text-sm text-warning/80 mt-2">
          • Aula 102 - Proyector necesita mantenimiento
          <br />
          • Laboratorio 1 - Reserva pendiente de confirmación para mañana
        </p>
      </div>
    </div>
  );
}