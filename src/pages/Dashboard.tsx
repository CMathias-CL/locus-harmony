import {
  Building2,
  Calendar,
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido al sistema de gestión académica
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Salas Totales"
          value="24"
          description="3 no disponibles"
          icon={Building2}
          trend={{ value: 5, isPositive: true }}
        />
        <MetricCard
          title="Reservas Hoy"
          value="18"
          description="de 32 posibles"
          icon={Calendar}
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          title="Profesores Activos"
          value="45"
          description="en este periodo"
          icon={Users}
          trend={{ value: 2, isPositive: true }}
        />
        <MetricCard
          title="Ocupación Promedio"
          value="78%"
          description="últimos 7 días"
          icon={TrendingUp}
          trend={{ value: 8, isPositive: true }}
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