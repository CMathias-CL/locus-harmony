import { Clock, CheckCircle, XCircle, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const activities = [
  {
    id: 1,
    type: "booking",
    title: "Reserva confirmada - Aula 101",
    time: "Hace 5 minutos",
    status: "confirmed",
    user: "Prof. García",
  },
  {
    id: 2,
    type: "cancellation",
    title: "Cancelación - Laboratorio 3",
    time: "Hace 15 minutos",
    status: "cancelled",
    user: "Prof. Martínez",
  },
  {
    id: 3,
    type: "booking",
    title: "Nueva reserva - Auditorio",
    time: "Hace 30 minutos",
    status: "pending",
    user: "Prof. López",
  },
  {
    id: 4,
    type: "modification",
    title: "Horario modificado - Aula 205",
    time: "Hace 1 hora",
    status: "confirmed",
    user: "Coordinador",
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "confirmed":
      return (
        <Badge variant="outline" className="border-success text-success">
          <CheckCircle className="w-3 h-3 mr-1" />
          Confirmado
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="outline" className="border-destructive text-destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Cancelado
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="outline" className="border-warning text-warning">
          <Clock className="w-3 h-3 mr-1" />
          Pendiente
        </Badge>
      );
    default:
      return null;
  }
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case "booking":
    case "modification":
      return <Calendar className="w-4 h-4 text-primary" />;
    case "cancellation":
      return <XCircle className="w-4 h-4 text-destructive" />;
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
};

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-academic"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground truncate">
                    {activity.title}
                  </p>
                  {getStatusBadge(activity.status)}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-xs text-muted-foreground">{activity.user}</p>
                  <span className="text-xs text-muted-foreground">•</span>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}